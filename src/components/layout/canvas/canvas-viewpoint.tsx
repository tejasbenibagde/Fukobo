  /* eslint-disable @typescript-eslint/no-explicit-any */
  // src/components/layout/canvas/canvas-viewpoint.tsx

  import { useRef, useState, useEffect } from "react";
  import { useDrawing } from "@/context/drawing-context";
  import { Button } from "@/components/ui/button";
  import { 
    ZoomIn, 
    ZoomOut, 
    Sparkles, 
    Play,
    Square,
    X,
  } from "lucide-react";
  import { Canvas, type HistoryEntry } from "fuderu";
  import { ReplayAction } from "@/types";

  const getLayerCompat = (canvasObj: any, id: string) => {
    if (!canvasObj) return undefined;
    if (typeof canvasObj.getLayer === "function") {
      return canvasObj.getLayer(id);
    }
    if (canvasObj.layers && typeof canvasObj.layers.getById === "function") {
      try {
        return canvasObj.layers.getById(id);
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  class CustomCanvasStateHistoryEntry implements HistoryEntry {
    constructor(
      public layerId: string,
      public beforeData: ImageData,
      public afterData: ImageData,
      private canvas: any
    ) {}

    undo() {
      const layer = getLayerCompat(this.canvas, this.layerId);
      if (layer) {
        layer.ctx.putImageData(this.beforeData, 0, 0);
        this.canvas.renderLayers();
      }
    }

    redo() {
      const layer = getLayerCompat(this.canvas, this.layerId);
      if (layer) {
        layer.ctx.putImageData(this.afterData, 0, 0);
        this.canvas.renderLayers();
      }
    }
  }

  export default function CanvasViewport() {
    const {
      activeTool,
      brushSize,
      brushOpacity,
      primaryColor,
      setPrimaryColor,
      fuderuCanvasRef,
      syncLayers,
      fontFamily,
      isBold,
      isItalic,
      textAlign,
      strokeType,
      fillShape,
      pressureSensitivityEnabled,
      canvasWidth,
      canvasHeight,
      currentArtworkId,
      artworks,
      replayStack,
      setReplayStack,
      loadArtwork,
      activeLayerId,
    } = useDrawing();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Custom tool state (Rectangle / Circle drag)
    const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
    const [shapeCurrent, setShapeCurrent] = useState<{ x: number; y: number } | null>(null);

    // Replay Timelapse Player State
    const [isReplaying, setIsReplaying] = useState(false);
    const [replayProgress, setReplayProgress] = useState(0);
    const [replaySpeed, setReplaySpeed] = useState(1);
    const replayIndexRef = useRef(0);
    const replayTimeoutRef = useRef<any>(null);

    const isReplayingRef = useRef(isReplaying);
    useEffect(() => {
      isReplayingRef.current = isReplaying;
    }, [isReplaying]);

    // Initialize fuderu Canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Create the fuderu Canvas instance with custom size
      const fuderuCanvas = new Canvas({
        canvas,
        document: { width: canvasWidth, height: canvasHeight },
        pressureSimulation: pressureSensitivityEnabled,
        brush: {
          size: brushSize,
          opacity: brushOpacity,
          color: primaryColor,
          eraser: activeTool === "eraser",
        }
      });

      fuderuCanvasRef.current = fuderuCanvas;

      // Load active artwork layers
      const currentArtwork = artworks.find(a => a.id === currentArtworkId);
      if (currentArtwork && currentArtwork.layers && currentArtwork.layers.length > 0) {
        const defaultLayers = fuderuCanvas.getLayers();
        const defaultLayerId = defaultLayers[0]?.id;

        const loadPromises = currentArtwork.layers.map((layerData, idx) => {
          return new Promise<void>((resolve) => {
            let layer: any;
            if (idx === 0 && defaultLayerId) {
              layer = getLayerCompat(fuderuCanvas, defaultLayerId);
              if (layer) {
                // Set the layer's ID directly to align with saved React layer IDs!
                layer.id = layerData.id;
                if (fuderuCanvas.layers && (fuderuCanvas.layers as any).activeLayerId === defaultLayerId) {
                  (fuderuCanvas.layers as any).activeLayerId = layerData.id;
                }
                fuderuCanvas.updateLayer(layerData.id, {
                  name: layerData.name,
                  visible: layerData.visible,
                  opacity: layerData.opacity,
                  blendMode: layerData.blendMode as any,
                });
              }
            } else {
              layer = fuderuCanvas.createLayer({
                id: layerData.id,
                name: layerData.name,
                visible: layerData.visible,
                opacity: layerData.opacity,
                blendMode: layerData.blendMode as any,
              });
            }

            if (layer && layerData.dataUrl) {
              const img = new Image();
              img.onload = () => {
                layer.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                layer.ctx.drawImage(img, 0, 0);
                resolve();
              };
              img.onerror = () => {
                resolve();
              };
              img.src = layerData.dataUrl;
            } else {
              if (idx === 0 && layer) {
                layer.ctx.fillStyle = "#ffffff";
                layer.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
              }
              resolve();
            }
          });
        });

        Promise.all(loadPromises).then(() => {
          // Set active layer to the top-most layer to correctly initialize Brush's context and prevent state clearing on first stroke
          const topLayerData = currentArtwork.layers[currentArtwork.layers.length - 1];
          if (topLayerData) {
            fuderuCanvas.setActiveLayer(topLayerData.id);
          } else {
            (fuderuCanvas as any).renderLayers();
          }
          syncLayers();
        });
      } else {
        const bg = fuderuCanvas.getLayers()[0];
        if (bg) {
          bg.ctx.fillStyle = "#ffffff";
          bg.ctx.fillRect(0, 0, bg.canvas.width, bg.canvas.height);
          (fuderuCanvas as any).renderLayers();
        }
        syncLayers();
      }

      // Let's add real-time stroke path logging to the replayStack!
      let isDrawingStroke = false;
      let strokePoints: { x: number; y: number; pressure: number }[] = [];

      const getInternalCoords = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * canvasWidth;
        const y = ((clientY - rect.top) / rect.height) * canvasHeight;
        return { x: Math.round(x), y: Math.round(y) };
      };

      const handlePointerDownCanvas = (e: PointerEvent) => {
        if (isReplayingRef.current) return;
        if (activeTool !== "brush" && activeTool !== "pencil" && activeTool !== "eraser") return;
        isDrawingStroke = true;
        strokePoints = [];
        const coords = getInternalCoords(e.clientX, e.clientY);
        strokePoints.push({ x: coords.x, y: coords.y, pressure: e.pressure ?? 0.5 });
      };

      const handlePointerMoveCanvas = (e: PointerEvent) => {
        if (isReplayingRef.current) return;
        if (!isDrawingStroke) return;
        const coords = getInternalCoords(e.clientX, e.clientY);
        strokePoints.push({ x: coords.x, y: coords.y, pressure: e.pressure ?? 0.5 });
      };

      const handlePointerUpWindow = () => {
        if (isDrawingStroke) {
          isDrawingStroke = false;
          if (strokePoints.length > 0) {
            const activeId = fuderuCanvas.layers.getActiveId() || "";
            const action: ReplayAction = {
              id: "action-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
              type: 'stroke',
              timestamp: Date.now(),
              data: {
                points: [...strokePoints],
                tool: activeTool,
                size: brushSize,
                opacity: brushOpacity,
                color: primaryColor,
                layerId: activeId,
              }
            };
            setReplayStack(prev => [...prev, action]);
          }
          strokePoints = [];
        }
        setTimeout(() => {
          syncLayers();
        }, 50);
      };

      canvas.addEventListener("pointerdown", handlePointerDownCanvas);
      canvas.addEventListener("pointermove", handlePointerMoveCanvas);
      window.addEventListener("pointerup", handlePointerUpWindow);

      return () => {
        fuderuCanvas.destroy();
        fuderuCanvasRef.current = null;
        canvas.removeEventListener("pointerdown", handlePointerDownCanvas);
        canvas.removeEventListener("pointermove", handlePointerMoveCanvas);
        window.removeEventListener("pointerup", handlePointerUpWindow);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentArtworkId]);

    // Dynamically sync brush size, opacity, color, and eraser state with the fuderu Canvas
    useEffect(() => {
      const fCanvas = fuderuCanvasRef.current;
      if (!fCanvas) return;

      fCanvas.pressureSimulation = pressureSensitivityEnabled;
      fCanvas.setEraser(activeTool === "eraser");

      if (fCanvas.brush) {
        fCanvas.brush.loadConfig({
          size: brushSize,
          opacity: brushOpacity,
          color: primaryColor,
        });
      }
    }, [brushSize, brushOpacity, primaryColor, activeTool, pressureSensitivityEnabled, fuderuCanvasRef]);

    // Coordinate mapper from Client Coordinates to Internal coordinates
    const getInternalCoords = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const n = canvas.width / rect.width;
      const r = canvas.height / rect.height;
      const x = Math.round((clientX - rect.left) * n);
      const y = Math.round((clientY - rect.top) * r);
      return {
        x: Math.max(0, Math.min(canvas.width, x)),
        y: Math.max(0, Math.min(canvas.height, y))
      };
    };

    const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const coords = getInternalCoords(e.clientX, e.clientY);
      setMousePos(coords);
    };

    const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (isReplaying) return;
      const coords = getInternalCoords(e.clientX, e.clientY);

      if (activeTool === "picker") {
        handlePicker(coords.x, coords.y);
      } else if (activeTool === "bucket") {
        handleBucket();
      } else if (activeTool === "rectangle" || activeTool === "circle") {
        setShapeStart(coords);
        setShapeCurrent(coords);
      } else if (activeTool === "text") {
        const text = prompt("Enter text to render on active layer:");
        if (text) {
          drawText(text, coords.x, coords.y);
        }
      }
    };

    const handleOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (isReplaying) return;
      const coords = getInternalCoords(e.clientX, e.clientY);
      setMousePos(coords);

      if (shapeStart) {
        setShapeCurrent(coords);
      }
    };

    const handleOverlayPointerUp = () => {
      if (isReplaying) return;
      if (shapeStart && shapeCurrent) {
        commitShape();
      }
    };

    const handlePicker = (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const imgData = ctx.getImageData(x, y, 1, 1).data;
      const r = imgData[0];
      const g = imgData[1];
      const b = imgData[2];
      const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      setPrimaryColor(hex);
    };

    const handleBucket = () => {
      if (!fuderuCanvasRef.current) return;
      const canvas = fuderuCanvasRef.current;
      const activeLayer = canvas.getActiveLayer();
      if (!activeLayer) return;

      const ctx = activeLayer.ctx;
      const beforeData = ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);

      ctx.save();
      ctx.fillStyle = primaryColor;
      ctx.globalAlpha = brushOpacity;
      ctx.fillRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
      ctx.restore();

      const afterData = ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
      const entry = new CustomCanvasStateHistoryEntry(activeLayer.id, beforeData, afterData, canvas);
      if (canvas.history && typeof canvas.history.push === "function") {
        canvas.history.push(entry);
      }

      (canvas as any).renderLayers();
      syncLayers();

      const action: ReplayAction = {
        id: "action-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        type: 'bucket',
        timestamp: Date.now(),
        data: {
          color: primaryColor,
          opacity: brushOpacity,
          layerId: activeLayer.id,
        }
      };
      setReplayStack(prev => [...prev, action]);
    };

    const commitShape = () => {
      if (!shapeStart || !shapeCurrent || !fuderuCanvasRef.current) return;
      const canvas = fuderuCanvasRef.current;
      const activeLayer = canvas.getActiveLayer();
      if (!activeLayer) return;

      const ctx = activeLayer.ctx;
      const beforeData = ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);

      ctx.save();

      ctx.lineWidth = brushSize;
      ctx.strokeStyle = primaryColor;
      ctx.fillStyle = primaryColor;
      ctx.globalAlpha = brushOpacity;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const x1 = shapeStart.x;
      const y1 = shapeStart.y;
      const x2 = shapeCurrent.x;
      const y2 = shapeCurrent.y;

      const width = x2 - x1;
      const height = y2 - y1;

      if (activeTool === "rectangle") {
        if (fillShape) {
          ctx.fillRect(x1, y1, width, height);
        } else {
          if (strokeType === "dashed") {
            ctx.setLineDash([15, 10]);
          } else if (strokeType === "dotted") {
            ctx.setLineDash([4, 4]);
          }
          ctx.strokeRect(x1, y1, width, height);
        }
      } else if (activeTool === "circle") {
        ctx.beginPath();
        const rx = Math.abs(width) / 2;
        const ry = Math.abs(height) / 2;
        const cx = x1 + width / 2;
        const cy = y1 + height / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        if (fillShape) {
          ctx.fill();
        } else {
          if (strokeType === "dashed") {
            ctx.setLineDash([15, 10]);
          } else if (strokeType === "dotted") {
            ctx.setLineDash([4, 4]);
          }
          ctx.stroke();
        }
      }

      ctx.restore();

      const afterData = ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
      const entry = new CustomCanvasStateHistoryEntry(activeLayer.id, beforeData, afterData, canvas);
      if (canvas.history && typeof canvas.history.push === "function") {
        canvas.history.push(entry);
      }

      (canvas as any).renderLayers();

      const action: ReplayAction = {
        id: "action-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        type: 'shape',
        timestamp: Date.now(),
        data: {
          shapeType: activeTool,
          startPoint: shapeStart,
          endPoint: shapeCurrent,
          size: brushSize,
          opacity: brushOpacity,
          color: primaryColor,
          strokeType,
          fillShape,
          layerId: activeLayer.id,
        }
      };
      setReplayStack(prev => [...prev, action]);

      setShapeStart(null);
      setShapeCurrent(null);
      syncLayers();
    };

    const drawText = (text: string, x: number, y: number) => {
      if (!fuderuCanvasRef.current) return;
      const canvas = fuderuCanvasRef.current;
      const activeLayer = canvas.getActiveLayer();
      if (!activeLayer) return;

      const ctx = activeLayer.ctx;
      const beforeData = ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);

      ctx.save();

      ctx.fillStyle = primaryColor;
      ctx.globalAlpha = brushOpacity;

      let fontStyle = "";
      if (isItalic) fontStyle += "italic ";
      if (isBold) fontStyle += "bold ";
      ctx.font = `${fontStyle}${brushSize * 2}px ${fontFamily}, sans-serif`;
      ctx.textAlign = textAlign as CanvasTextAlign;
      ctx.textBaseline = "middle";

      ctx.fillText(text, x, y);
      ctx.restore();

      const afterData = ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
      const entry = new CustomCanvasStateHistoryEntry(activeLayer.id, beforeData, afterData, canvas);
      if (canvas.history && typeof canvas.history.push === "function") {
        canvas.history.push(entry);
      }

      (canvas as any).renderLayers();
      syncLayers();

      const action: ReplayAction = {
        id: "action-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        type: 'text',
        timestamp: Date.now(),
        data: {
          text,
          startPoint: { x, y },
          size: brushSize,
          opacity: brushOpacity,
          color: primaryColor,
          fontFamily,
          isBold,
          isItalic,
          textAlign,
          layerId: activeLayer.id,
        }
      };
      setReplayStack(prev => [...prev, action]);
    };

    const restoreArtworkLayersFromSaved = () => {
      const fuderuCanvas = fuderuCanvasRef.current;
      if (!fuderuCanvas) return;

      const currentArtwork = artworks.find(a => a.id === currentArtworkId);
      if (currentArtwork && currentArtwork.layers && currentArtwork.layers.length > 0) {
        fuderuCanvas.clear();
        const allLayers = [...fuderuCanvas.getLayers()];
        for (let i = allLayers.length - 1; i > 0; i--) {
          fuderuCanvas.deleteLayer(allLayers[i].id);
        }

        const defaultLayerId = fuderuCanvas.getLayers()[0]?.id;

        const loadPromises = currentArtwork.layers.map((layerData, idx) => {
          return new Promise<void>((resolve) => {
            let layer: any;
            if (idx === 0 && defaultLayerId) {
              layer = getLayerCompat(fuderuCanvas, defaultLayerId);
              if (layer) {
                layer.id = layerData.id;
                if (fuderuCanvas.layers && (fuderuCanvas.layers as any).activeLayerId === defaultLayerId) {
                  (fuderuCanvas.layers as any).activeLayerId = layerData.id;
                }
                fuderuCanvas.updateLayer(layerData.id, {
                  name: layerData.name,
                  visible: layerData.visible,
                  opacity: layerData.opacity,
                  blendMode: layerData.blendMode as any,
                });
              }
            } else {
              layer = fuderuCanvas.createLayer({
                id: layerData.id,
                name: layerData.name,
                visible: layerData.visible,
                opacity: layerData.opacity,
                blendMode: layerData.blendMode as any,
              });
            }

            if (layer && layerData.dataUrl) {
              const img = new Image();
              img.onload = () => {
                layer.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                layer.ctx.drawImage(img, 0, 0);
                resolve();
              };
              img.onerror = () => {
                resolve();
              };
              img.src = layerData.dataUrl;
            } else {
              if (idx === 0 && layer) {
                layer.ctx.fillStyle = "#ffffff";
                layer.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
              }
              resolve();
            }
          });
        });

        Promise.all(loadPromises).then(() => {
          const topLayerData = currentArtwork.layers[currentArtwork.layers.length - 1];
          if (topLayerData) {
            fuderuCanvas.setActiveLayer(topLayerData.id);
          } else {
            (fuderuCanvas as any).renderLayers();
          }
          syncLayers();
        });
      } else {
        const bg = fuderuCanvas.getLayers()[0];
        if (bg) {
          bg.ctx.fillStyle = "#ffffff";
          bg.ctx.fillRect(0, 0, bg.canvas.width, bg.canvas.height);
          (fuderuCanvas as any).renderLayers();
        }
        syncLayers();
      }
    };

    const stopReplay = () => {
      if (replayTimeoutRef.current) {
        clearTimeout(replayTimeoutRef.current);
        replayTimeoutRef.current = null;
      }
      setIsReplaying(false);
      if (currentArtworkId) {
        loadArtwork(currentArtworkId);
        restoreArtworkLayersFromSaved();
      }
    };

    const startReplay = () => {
      if (!fuderuCanvasRef.current) return;
      setIsReplaying(true);
      replayIndexRef.current = 0;
      setReplayProgress(0);

      const canvas = fuderuCanvasRef.current;
      canvas.clear();
      const allLayers = canvas.getLayers();
      for (let i = allLayers.length - 1; i > 0; i--) {
        canvas.deleteLayer(allLayers[i].id);
      }
      const bg = allLayers[0];
      if (bg) {
        bg.ctx.fillStyle = "#ffffff";
        bg.ctx.fillRect(0, 0, bg.canvas.width, bg.canvas.height);
      }
      canvas.renderLayers();
      syncLayers();

      setTimeout(() => {
        runNextReplayStep();
      }, 300);
    };

    const runNextReplayStep = () => {
      if (!fuderuCanvasRef.current) return;
      const canvas = fuderuCanvasRef.current;

      if (replayIndexRef.current >= replayStack.length) {
        setIsReplaying(false);
        const targetId = activeLayerId && canvas.getLayers().some((l: any) => l.id === activeLayerId)
          ? activeLayerId
          : (canvas.getLayers()[canvas.getLayers().length - 1]?.id || "");
        if (targetId) {
          canvas.setActiveLayer(targetId);
        }
        syncLayers();
        return;
      }

      const action = replayStack[replayIndexRef.current];
      executeReplayAction(canvas, action);

      replayIndexRef.current++;
      setReplayProgress(Math.round((replayIndexRef.current / replayStack.length) * 100));

      let baseDelay = 150;
      if (action.type === 'stroke' && action.data.points) {
        baseDelay = Math.max(50, action.data.points.length * 3);
      }
      const delay = Math.max(20, baseDelay / replaySpeed);

      replayTimeoutRef.current = setTimeout(runNextReplayStep, delay);
    };

    const executeReplayAction = (canvas: any, action: ReplayAction) => {
      const { type, data } = action;
      try {
        if (type === 'clear') {
          canvas.clear();
          const bg = canvas.getLayers()[0];
          if (bg) {
            bg.ctx.fillStyle = "#ffffff";
            bg.ctx.fillRect(0, 0, bg.canvas.width, bg.canvas.height);
          }
        } else if (type === 'addLayer') {
          canvas.createLayer({ id: data.layerId, name: data.layerName });
        } else if (type === 'deleteLayer') {
          if (data.layerId) {
            canvas.deleteLayer(data.layerId);
          }
        } else if (type === 'renameLayer') {
          if (data.layerId && data.layerName) {
            canvas.updateLayer(data.layerId, { name: data.layerName });
          }
        } else if (type === 'setLayerOpacity') {
          if (data.layerId) {
            canvas.updateLayer(data.layerId, { 
              opacity: data.opacity, 
              visible: data.visible !== false 
            });
          }
        } else if (type === 'setLayerBlendMode') {
          if (data.layerId && data.blendMode) {
            canvas.updateLayer(data.layerId, { blendMode: data.blendMode as any });
          }
        } else if (type === 'reorderLayers' && data.targetIds) {
          for (let i = 0; i < data.targetIds.length; i++) {
            canvas.layers.moveLayer(data.targetIds[i], i);
          }
        } else if (type === 'bucket') {
          if (data.layerId) {
            const layer = getLayerCompat(canvas, data.layerId);
            if (layer) {
              layer.ctx.save();
              layer.ctx.fillStyle = data.color || "#000000";
              layer.ctx.globalAlpha = data.opacity ?? 1;
              layer.ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
              layer.ctx.restore();
            }
          }
        } else if (type === 'shape') {
          if (data.layerId && data.startPoint && data.endPoint) {
            const layer = getLayerCompat(canvas, data.layerId);
            if (layer) {
              layer.ctx.save();
              layer.ctx.lineWidth = data.size || 5;
              layer.ctx.strokeStyle = data.color || "#000000";
              layer.ctx.fillStyle = data.color || "#000000";
              layer.ctx.globalAlpha = data.opacity ?? 1;
              layer.ctx.lineCap = "round";
              layer.ctx.lineJoin = "round";
              
              const x1 = data.startPoint.x;
              const y1 = data.startPoint.y;
              const x2 = data.endPoint.x;
              const y2 = data.endPoint.y;
              const w = x2 - x1;
              const h = y2 - y1;
              
              if (data.strokeType === "dashed") {
                layer.ctx.setLineDash([15, 10]);
              } else if (data.strokeType === "dotted") {
                layer.ctx.setLineDash([4, 4]);
              }
              
              if (data.shapeType === "rectangle") {
                if (data.fillShape) {
                  layer.ctx.fillRect(x1, y1, w, h);
                } else {
                  layer.ctx.strokeRect(x1, y1, w, h);
                }
              } else if (data.shapeType === "circle") {
                layer.ctx.beginPath();
                const rx = Math.abs(w) / 2;
                const ry = Math.abs(h) / 2;
                const cx = x1 + w / 2;
                const cy = y1 + h / 2;
                layer.ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
                if (data.fillShape) {
                  layer.ctx.fill();
                } else {
                  layer.ctx.stroke();
                }
              }
              layer.ctx.restore();
            }
          }
        } else if (type === 'text') {
          if (data.layerId && data.startPoint && data.text) {
            const layer = getLayerCompat(canvas, data.layerId);
            if (layer) {
              layer.ctx.save();
              layer.ctx.fillStyle = data.color || "#000000";
              layer.ctx.globalAlpha = data.opacity ?? 1;
              
              let style = "";
              if (data.isItalic) style += "italic ";
              if (data.isBold) style += "bold ";
              layer.ctx.font = `${style}${(data.size || 5) * 2}px ${data.fontFamily || "Inter"}, sans-serif`;
              layer.ctx.textAlign = (data.textAlign || "left") as CanvasTextAlign;
              layer.ctx.textBaseline = "middle";
              
              layer.ctx.fillText(data.text, data.startPoint.x, data.startPoint.y);
              layer.ctx.restore();
            }
          }
        } else if (type === 'stroke' && data.points && data.points.length > 0) {
          if (data.layerId) {
            const layer = getLayerCompat(canvas, data.layerId);
            if (layer) {
              layer.ctx.save();
              layer.ctx.lineWidth = data.size || 5;
              layer.ctx.strokeStyle = data.color || "#000000";
              layer.ctx.globalAlpha = data.opacity ?? 1;
              layer.ctx.lineCap = "round";
              layer.ctx.lineJoin = "round";
              
              if (data.tool === 'eraser') {
                layer.ctx.globalCompositeOperation = 'destination-out';
              } else {
                layer.ctx.globalCompositeOperation = 'source-over';
              }
              
              const pts = data.points;
              layer.ctx.beginPath();
              layer.ctx.moveTo(pts[0].x, pts[0].y);
              for (let i = 1; i < pts.length; i++) {
                layer.ctx.lineTo(pts[i].x, pts[i].y);
              }
              layer.ctx.stroke();
              layer.ctx.restore();
            }
          }
        }
        canvas.renderLayers();
        syncLayers();
      } catch (err) {
        console.error("Failed to execute replay action", err);
      }
    };

    const renderShapePreview = () => {
      if (!shapeStart || !shapeCurrent) return null;

      const x1 = shapeStart.x;
      const y1 = shapeStart.y;
      const x2 = shapeCurrent.x;
      const y2 = shapeCurrent.y;

      const width = x2 - x1;
      const height = y2 - y1;

      const isDashed = strokeType === "dashed";
      const isDotted = strokeType === "dotted";
      const dashArray = isDashed ? "15,10" : isDotted ? "4,4" : undefined;

      return (
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-20" viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}>
          {activeTool === "rectangle" && (
            <rect
              x={Math.min(x1, x2)}
              y={Math.min(y1, y2)}
              width={Math.abs(width)}
              height={Math.abs(height)}
              fill={fillShape ? primaryColor : "none"}
              stroke={primaryColor}
              strokeWidth={brushSize}
              strokeDasharray={dashArray}
              opacity={brushOpacity}
            />
          )}
          {activeTool === "circle" && (
            <ellipse
              cx={x1 + width / 2}
              cy={y1 + height / 2}
              rx={Math.abs(width) / 2}
              ry={Math.abs(height) / 2}
              fill={fillShape ? primaryColor : "none"}
              stroke={primaryColor}
              strokeWidth={brushSize}
              strokeDasharray={dashArray}
              opacity={brushOpacity}
            />
          )}
        </svg>
      );
    };

    return (
      <div className="flex-1 h-full bg-muted/30 flex flex-col relative overflow-hidden select-none">
        {/* Canvas Header Control Strip */}
        <div className="h-11 border-b bg-background/60 backdrop-blur-sm flex items-center justify-between px-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Canvas Size: <strong className="text-foreground">{canvasWidth} × {canvasHeight}px</strong></span>
            </div>

            {replayStack && replayStack.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 ml-2 border-primary/20 text-primary hover:bg-primary/5 flex items-center gap-1 text-[11px] font-semibold"
                onClick={startReplay}
                disabled={isReplaying}
              >
                <Play className="h-3 w-3 fill-current animate-pulse text-primary" />
                <span>Timelapse</span>
              </Button>
            )}
          </div>

          {/* Viewport Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="font-mono text-xs font-semibold px-1.5 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Main Drawing Stage Area */}
        <div className="flex-1 w-full overflow-auto flex items-center justify-center p-6 bg-secondary/30 relative">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, #000 10%, transparent 11%)',
            backgroundSize: '12px 12px'
          }} />

          {/* Scalable Paper Artboard Card */}
          <div 
            className="bg-white rounded-lg shadow-xl border border-border/80 overflow-hidden transition-all duration-200 shrink-0 relative"
            style={{ 
              width: canvasWidth,
              height: canvasHeight,
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "center center"
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              onPointerMove={handleCanvasPointerMove}
              className="cursor-crosshair block shadow-inner bg-white"
            />

            {/* Overlay to capture pointer events for non-drawing tools */}
            {activeTool !== "brush" && activeTool !== "pencil" && activeTool !== "eraser" && (
              <div
                className="absolute inset-0 cursor-crosshair z-10"
                onPointerDown={handleOverlayPointerDown}
                onPointerMove={handleOverlayPointerMove}
                onPointerUp={handleOverlayPointerUp}
              />
            )}

            {/* Real-time shape drag rendering overlay */}
            {renderShapePreview()}
          </div>
        </div>

        {/* Mini Status Overlay (Bottom Left of Canvas Viewport) */}
        <div className="absolute bottom-3 left-4 bg-background/90 backdrop-blur-md border border-border/60 shadow-md rounded-md px-3 py-1.5 flex items-center gap-4 text-[10px] font-mono text-muted-foreground/90 font-semibold z-10">
          <div>
            X: <span className="text-foreground">{mousePos.x}px</span>
          </div>
          <div className="w-[1px] h-3 bg-border" />
          <div>
            Y: <span className="text-foreground">{mousePos.y}px</span>
          </div>
        </div>

        {/* Replay Timelapse Player Overlay */}
        {isReplaying && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-6 select-none pointer-events-auto">
            <div className="bg-background/95 border border-border/80 shadow-2xl rounded-xl p-5 w-full max-w-md flex flex-col gap-4 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Replaying Timelapse</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={stopReplay}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>Step {replayIndexRef.current} of {replayStack.length}</span>
                  <span>{replayProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-150" style={{ width: `${replayProgress}%` }} />
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 px-2.5 text-xs font-semibold ${replaySpeed === 1 ? 'bg-primary/10 border-primary/30 text-primary' : ''}`}
                    onClick={() => setReplaySpeed(1)}
                  >
                    1x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 px-2.5 text-xs font-semibold ${replaySpeed === 2 ? 'bg-primary/10 border-primary/30 text-primary' : ''}`}
                    onClick={() => setReplaySpeed(2)}
                  >
                    2x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 px-2.5 text-xs font-semibold ${replaySpeed === 4 ? 'bg-primary/10 border-primary/30 text-primary' : ''}`}
                    onClick={() => setReplaySpeed(4)}
                  >
                    4x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 px-2.5 text-xs font-semibold ${replaySpeed === 8 ? 'bg-primary/10 border-primary/30 text-primary' : ''}`}
                    onClick={() => setReplaySpeed(8)}
                  >
                    8x
                  </Button>
                </div>
                
                <Button variant="destructive" size="sm" className="h-7 px-3 flex items-center gap-1.5 text-xs font-semibold" onClick={stopReplay}>
                  <Square className="h-3 w-3 fill-current" />
                  <span>Stop</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
