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

export default function CanvasViewport() {
  const {
    activeTool,
    brushSize,
    brushOpacity,
    primaryColor,
    setPrimaryColor,
  } = useDrawing();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas internal resolution (e.g., 800x600 standard painting container)
    canvas.width = 800;
    canvas.height = 600;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Fill white background initially
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.lineCap = "round";
    context.lineJoin = "round";
    contextRef.current = context;
  }, []);

  // Update context styles when brush settings change
  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;

    context.lineWidth = brushSize;
    context.globalAlpha = brushOpacity;

    if (activeTool === "eraser") {
      context.strokeStyle = "#ffffff"; // Eraser uses white
    } else if (activeTool === "pencil") {
      context.strokeStyle = primaryColor;
      context.lineCap = "butt"; // Pencil is sharper
      context.lineWidth = Math.max(1, Math.round(brushSize / 3));
    } else {
      context.strokeStyle = primaryColor;
      context.lineCap = "round";
    }
  }, [activeTool, brushSize, brushOpacity, primaryColor]);

  // Handle Drawing Coordinates
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Scale according to CSS zoom
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    return { x: Math.round(x), y: Math.round(y) };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    
    const context = contextRef.current;
    if (!context) return;

    // Eyedropper Color Picker Tool implementation
    if (activeTool === "picker") {
      const imgData = context.getImageData(x, y, 1, 1).data;
      const r = imgData[0];
      const g = imgData[1];
      const b = imgData[2];
      const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      setPrimaryColor(hex);
      return;
    }

    // Flood Fill Paint Bucket Tool implementation
    if (activeTool === "bucket") {
      context.fillStyle = primaryColor;
      context.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      // Trigger simple statusbar text change
      const statusEl = document.querySelector('footer');
      if (statusEl) statusEl.innerText = "Canvas flooded with color " + primaryColor;
      return;
    }

    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    setMousePos({ x, y });

    if (!isDrawing || !contextRef.current) return;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && contextRef.current) {
      contextRef.current.closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex-1 h-full bg-muted/30 flex flex-col relative overflow-hidden select-none">
      {/* Canvas Header Control Strip */}
      <div className="h-11 border-b bg-background/60 backdrop-blur-sm flex items-center justify-between px-4 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Canvas Status: <strong className="text-foreground">800 x 600px</strong></span>
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
          <span className="font-mono text-xs font-semibold px-1.5 min-w-10.5 text-center">
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

          <div className="h-4 w-px bg-border mx-1" />

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
          className="bg-white rounded-lg shadow-xl border border-border/80 overflow-hidden transition-all duration-200 shrink-0"
          style={{ 
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "center center"
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="cursor-crosshair block shadow-inner bg-white"
          />
        </div>
      </div>

      {/* Mini Status Overlay (Bottom Left of Canvas Viewport) */}
      <div className="absolute bottom-3 left-4 bg-background/90 backdrop-blur-md border border-border/60 shadow-md rounded-md px-3 py-1.5 flex items-center gap-4 text-[10px] font-mono text-muted-foreground/90 font-semibold z-10">
        <div>
          X: <span className="text-foreground">{mousePos.x}px</span>
        </div>
        <div className="w-px h-3 bg-border" />
        <div>
          Y: <span className="text-foreground">{mousePos.y}px</span>
        </div>
      </div>
    </div>
  );
}
