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
import { Canvas } from "fuderu";

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
  const isReplayingRef = useRef(false);

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

    // Listen to native Fuderu events
    const unsubChange = fuderuCanvas.on("change", () => {
      syncLayers();
    });
    const unsubHistory = fuderuCanvas.on("history:change", () => {
      syncLayers();
    });
    const unsubLayer = fuderuCanvas.on("layer:change", () => {
      syncLayers();
    });
    const unsubAction = fuderuCanvas.on("action:record", (action) => {
      setReplayStack(prev => [...prev, action]);
    });

    // Load active artwork
    const currentArtwork = artworks.find(a => a.id === currentArtworkId);
    if (currentArtwork?.document) {
      fuderuCanvas.importDocument(currentArtwork.document).then(() => {
        syncLayers();
      });
    } else if (currentArtwork?.layers && currentArtwork.layers.length > 0) {
      // Legacy fallback
      const defaultLayers = fuderuCanvas.getLayers();
      const defaultLayerId = defaultLayers[0]?.id;

      const loadPromises = currentArtwork.layers.map((layerData, idx) => {
        return new Promise<void>((resolve) => {
          let layer: any;
          if (idx === 0 && defaultLayerId) {
            layer = fuderuCanvas.getLayerById(defaultLayerId);
            if (layer) {
              fuderuCanvas.updateLayer(layer.id, {
                name: layerData.name,
                visible: layerData.visible,
                opacity: layerData.opacity,
                blendMode: layerData.blendMode as any,
                alphaLock: layerData.alphaLock ?? false,
                locked: layerData.locked ?? false,
              });
            }
          } else {
            layer = fuderuCanvas.createLayer({
              id: layerData.id,
              name: layerData.name,
              visible: layerData.visible,
              opacity: layerData.opacity,
              blendMode: layerData.blendMode as any,
              alphaLock: layerData.alphaLock ?? false,
              locked: layerData.locked ?? false,
            });
          }

          if (layer && layerData.dataUrl) {
            const img = new Image();
            img.onload = () => {
              layer.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
              layer.ctx.drawImage(img, 0, 0);
              resolve();
            };
            img.onerror = () => resolve();
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
        const topLayerData = currentArtwork.layers![currentArtwork.layers!.length - 1];
        if (topLayerData) {
          fuderuCanvas.setActiveLayer(topLayerData.id);
        }
        fuderuCanvas.renderLayers();
        syncLayers();
      });
    } else {
      const bg = fuderuCanvas.getLayers()[0];
      if (bg) {
        bg.ctx.fillStyle = "#ffffff";
        bg.ctx.fillRect(0, 0, bg.canvas.width, bg.canvas.height);
        fuderuCanvas.renderLayers();
      }
      syncLayers();
    }

    return () => {
      if (unsubChange) unsubChange();
      if (unsubHistory) unsubHistory();
      if (unsubLayer) unsubLayer();
      if (unsubAction) unsubAction();
      fuderuCanvas.destroy();
      fuderuCanvasRef.current = null;
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

    const canvasObj = fuderuCanvasRef.current;
    if (!canvasObj) return;

    const activeLayer = canvasObj.getActiveLayer();
    if (activeLayer?.locked) return;

    if (activeTool === "picker") {
      handlePicker(coords.x, coords.y);
    } else if (activeTool === "bucket") {
      handleBucket(coords.x, coords.y);
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
    const fCanvas = fuderuCanvasRef.current;
    if (!fCanvas) return;
    const sample = fCanvas.getColorAt(x, y, "composite");
    if (sample && sample.hex) {
      setPrimaryColor(sample.hex);
    }
  };

  const handleBucket = (x: number, y: number) => {
    const canvas = fuderuCanvasRef.current;
    if (!canvas) return;
    const activeLayer = canvas.getActiveLayer();
    if (!activeLayer || activeLayer.locked) return;

    canvas.floodFill(Math.round(x), Math.round(y), primaryColor, 32);
    syncLayers();
  };

  const commitShape = () => {
    if (!shapeStart || !shapeCurrent || !fuderuCanvasRef.current) return;
    const canvas = fuderuCanvasRef.current;
    const activeLayer = canvas.getActiveLayer();
    if (!activeLayer || activeLayer.locked) return;

    const x1 = shapeStart.x;
    const y1 = shapeStart.y;
    const x2 = shapeCurrent.x;
    const y2 = shapeCurrent.y;

    const width = x2 - x1;
    const height = y2 - y1;

    if (activeTool === "rectangle") {
      canvas.drawRectangle({
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(width),
        height: Math.abs(height),
        fill: fillShape,
        stroke: !fillShape,
        fillColor: primaryColor,
        strokeColor: primaryColor,
        strokeWidth: brushSize,
      });
    } else if (activeTool === "circle") {
      const rx = Math.abs(width) / 2;
      const ry = Math.abs(height) / 2;
      const cx = Math.min(x1, x2) + rx;
      const cy = Math.min(y1, y2) + ry;

      canvas.drawEllipse({
        x: cx,
        y: cy,
        radiusX: rx,
        radiusY: ry,
        fill: fillShape,
        stroke: !fillShape,
        fillColor: primaryColor,
        strokeColor: primaryColor,
        strokeWidth: brushSize,
      });
    }

    syncLayers();
    setShapeStart(null);
    setShapeCurrent(null);
  };

  const drawText = (text: string, x: number, y: number) => {
    const canvas = fuderuCanvasRef.current;
    if (!canvas) return;
    const activeLayer = canvas.getActiveLayer();
    if (!activeLayer || activeLayer.locked) return;

    let fontStyleStr = "";
    if (isItalic) fontStyleStr += "italic ";

    canvas.drawText(text, x, y, {
      fontSize: brushSize * 2,
      fontFamily: fontFamily || "sans-serif",
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: fontStyleStr,
      color: primaryColor,
      align: (textAlign as CanvasTextAlign) || "center",
      baseline: "middle",
    });

    syncLayers();
  };

  const restoreArtwork = async () => {
    const fuderuCanvas = fuderuCanvasRef.current;
    if (!fuderuCanvas) return;
    const currentArtwork = artworks.find(a => a.id === currentArtworkId);
    if (currentArtwork?.document) {
      await fuderuCanvas.importDocument(currentArtwork.document);
      syncLayers();
    }
  };

  const stopReplay = async () => {
    isReplayingRef.current = false;
    setIsReplaying(false);
    await restoreArtwork();
  };

  const startReplay = async () => {
    const canvas = fuderuCanvasRef.current;
    if (!canvas) return;
    const actions = canvas.getActionLog();
    if (!actions || actions.length === 0) return;

    setIsReplaying(true);
    isReplayingRef.current = true;
    setReplayProgress(0);

    await canvas.clear();
    const bg = canvas.getLayers()[0];
    if (bg) {
      bg.ctx.fillStyle = "#ffffff";
      bg.ctx.fillRect(0, 0, bg.canvas.width, bg.canvas.height);
      canvas.renderLayers();
    }

    try {
      await canvas.replay(actions, {
        speed: replaySpeed,
        animateStrokes: true,
        onProgress: (progress) => {
          if (isReplayingRef.current) {
            setReplayProgress(Math.round(progress * 100));
          }
        }
      });
    } catch (e) {
      console.error("Replay encountered an error", e);
    } finally {
      if (isReplayingRef.current) {
        setIsReplaying(false);
        isReplayingRef.current = false;
        syncLayers();
      }
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
