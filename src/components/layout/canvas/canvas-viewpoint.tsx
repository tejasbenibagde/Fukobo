/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/layout/canvas/canvas-viewpoint.tsx

import { useRef, useState, useEffect } from "react";
import { useDrawing } from "@/context/drawing-context";
import { Button } from "@/components/ui/button";
import { 
  ZoomIn, 
  ZoomOut, 
  Sparkles, 
  Trash2,
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
    clearCanvas,
    fontFamily,
    isBold,
    isItalic,
    textAlign,
    strokeType,
    fillShape,
  } = useDrawing();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Custom tool state (Rectangle / Circle drag)
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [shapeCurrent, setShapeCurrent] = useState<{ x: number; y: number } | null>(null);

  // Initialize fuderu Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create the fuderu Canvas instance
    const fuderuCanvas = new Canvas({
      canvas,
      document: { width: 800, height: 600 },
      pressureSimulation: true,
      brush: {
        size: brushSize,
        opacity: brushOpacity,
        color: primaryColor,
        eraser: activeTool === "eraser",
      }
    });

    // Fill background layer with solid white initially
    const bg = fuderuCanvas.getLayers()[0];
    if (bg) {
      bg.ctx.fillStyle = "#ffffff";
      bg.ctx.fillRect(0, 0, bg.canvas.width, bg.canvas.height);
      
      // Initialize brush stack with the clean background state so undo works back to base paper
      const brushInstance = fuderuCanvas.brush as any;
      if (brushInstance && brushInstance.canvasStack) {
        brushInstance.canvasStack = [bg.ctx.getImageData(0, 0, bg.canvas.width, bg.canvas.height)];
        brushInstance.canvasStackIndex = 0;
      }
      
      (fuderuCanvas as any).renderLayers();
    }

    fuderuCanvasRef.current = fuderuCanvas;
    
    // Sync React states initially
    syncLayers();

    // Event listener to sync layers after user finishes drawing stroke
    const handlePointerUpWindow = () => {
      // Small timeout to let endStroke finish and push onto the stack
      setTimeout(() => {
        syncLayers();
      }, 50);
    };
    window.addEventListener("pointerup", handlePointerUpWindow);

    return () => {
      fuderuCanvas.destroy();
      fuderuCanvasRef.current = null;
      window.removeEventListener("pointerup", handlePointerUpWindow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Coordinate mapper from Client Coordinates to Internal 800x600 coordinates
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

  const handlePointerDownCapture = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getInternalCoords(e.clientX, e.clientY);

    // If active tool is picker, bucket, shapes or text, stop propagation so fuderu doesn't brush-stroke draw
    if (activeTool !== "brush" && activeTool !== "pencil" && activeTool !== "eraser") {
      e.nativeEvent.stopImmediatePropagation();
      e.stopPropagation();

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
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getInternalCoords(e.clientX, e.clientY);
    setMousePos(coords);

    if (shapeStart) {
      e.nativeEvent.stopImmediatePropagation();
      e.stopPropagation();
      setShapeCurrent(coords);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (shapeStart && shapeCurrent) {
      e.nativeEvent.stopImmediatePropagation();
      e.stopPropagation();
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
    ctx.save();
    ctx.fillStyle = primaryColor;
    ctx.globalAlpha = brushOpacity;
    ctx.fillRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
    ctx.restore();

    // Push into brush stack
    const brushInstance = canvas.brush as any;
    if (brushInstance && brushInstance.maxUndoRedoStackSize > 0) {
      if (brushInstance.canvasStackIndex !== brushInstance.canvasStack.length - 1) {
        brushInstance.canvasStack.splice(brushInstance.canvasStackIndex + 1, brushInstance.canvasStack.length - brushInstance.canvasStackIndex - 1);
      }
      brushInstance.canvasStackIndex = brushInstance.canvasStack.push(ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height)) - 1;
    }

    (canvas as any).renderLayers();
    syncLayers();
  };

  const commitShape = () => {
    if (!shapeStart || !shapeCurrent || !fuderuCanvasRef.current) return;
    const canvas = fuderuCanvasRef.current;
    const activeLayer = canvas.getActiveLayer();
    if (!activeLayer) return;

    const ctx = activeLayer.ctx;
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

    // Push into brush stack
    const brushInstance = canvas.brush as any;
    if (brushInstance && brushInstance.maxUndoRedoStackSize > 0) {
      if (brushInstance.canvasStackIndex !== brushInstance.canvasStack.length - 1) {
        brushInstance.canvasStack.splice(brushInstance.canvasStackIndex + 1, brushInstance.canvasStack.length - brushInstance.canvasStackIndex - 1);
      }
      brushInstance.canvasStackIndex = brushInstance.canvasStack.push(ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height)) - 1;
    }

    (canvas as any).renderLayers();

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

    // Push into brush stack
    const brushInstance = canvas.brush as any;
    if (brushInstance && brushInstance.maxUndoRedoStackSize > 0) {
      if (brushInstance.canvasStackIndex !== brushInstance.canvasStack.length - 1) {
        brushInstance.canvasStack.splice(brushInstance.canvasStackIndex + 1, brushInstance.canvasStack.length - brushInstance.canvasStackIndex - 1);
      }
      brushInstance.canvasStackIndex = brushInstance.canvasStack.push(ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height)) - 1;
    }

    (canvas as any).renderLayers();
    syncLayers();
  };

  // Render SVG stroke/fill previews during real-time dragging
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
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-20" viewBox="0 0 800 600">
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
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Canvas Status: <strong className="text-foreground">800 × 600px</strong></span>
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

          <div className="h-4 w-[1px] bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={clearCanvas}
            title="Clear Painting"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Drawing Stage Area */}
      <div className="flex-1 w-full overflow-auto flex items-center justify-center p-6 bg-secondary/30 relative">
        {/* Transparent grid check pattern behind the canvas */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #000 10%, transparent 11%)',
          backgroundSize: '12px 12px'
        }} />

        {/* Scalable Paper Artboard Card */}
        <div 
          className="bg-white rounded-lg shadow-xl border border-border/80 overflow-hidden transition-all duration-200 shrink-0 relative"
          style={{ 
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "center center"
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDownCapture={handlePointerDownCapture}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="cursor-crosshair block shadow-inner bg-white"
          />

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
    </div>
  );
}
