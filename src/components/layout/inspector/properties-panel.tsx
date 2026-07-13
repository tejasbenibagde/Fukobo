// src/components/layout/inspector/properties-panel.tsx

import { useDrawing } from "@/context/drawing-context";
import { 
  SlidersHorizontal, 
  Type, 
  Paintbrush, 
  Square, 
  Circle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic
} from "lucide-react";
import { useState } from "react";

export default function PropertiesPanel() {
  const { activeTool, brushSize, primaryColor, brushOpacity } = useDrawing();
  const [fontFamily, setFontFamily] = useState("Montserrat");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textAlign, setTextAlign] = useState("center");
  const [strokeType, setStrokeType] = useState("solid");
  const [fillShape, setFillShape] = useState(false);

  // Helper to render tool specific properties
  const renderToolProperties = () => {
    switch (activeTool) {
      case "text":
        return (
          <div className="space-y-4 pt-1">
            {/* Font Family Selection */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Font Family
              </span>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-background border rounded-md px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Montserrat">Montserrat</option>
                <option value="Inter">Inter</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>

            {/* Font Styles */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Typography Styling
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBold(!isBold)}
                  className={`flex-1 flex items-center justify-center h-8 rounded border text-xs font-semibold gap-1.5 transition-colors ${
                    isBold ? "bg-primary/10 border-primary text-primary" : "hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <Bold className="h-3.5 w-3.5" />
                  <span>Bold</span>
                </button>
                <button
                  onClick={() => setIsItalic(!isItalic)}
                  className={`flex-1 flex items-center justify-center h-8 rounded border text-xs font-semibold gap-1.5 transition-colors ${
                    isItalic ? "bg-primary/10 border-primary text-primary" : "hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <Italic className="h-3.5 w-3.5" />
                  <span>Italic</span>
                </button>
              </div>
            </div>

            {/* Alignment */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Alignment
              </span>
              <div className="grid grid-cols-3 gap-1 border p-0.5 rounded-lg bg-muted/40">
                <button
                  onClick={() => setTextAlign("left")}
                  className={`flex items-center justify-center h-7 rounded-md text-xs transition-all ${
                    textAlign === "left" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <AlignLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setTextAlign("center")}
                  className={`flex items-center justify-center h-7 rounded-md text-xs transition-all ${
                    textAlign === "center" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <AlignCenter className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setTextAlign("right")}
                  className={`flex items-center justify-center h-7 rounded-md text-xs transition-all ${
                    textAlign === "right" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <AlignRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );

      case "rectangle":
      case "circle":
        return (
          <div className="space-y-4 pt-1">
            {/* Outline / Fill */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Shape Fill Style
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFillShape(false)}
                  className={`flex-1 h-8 rounded border text-xs font-semibold transition-colors ${
                    !fillShape ? "bg-primary/10 border-primary text-primary" : "hover:bg-accent text-muted-foreground"
                  }`}
                >
                  Stroke Outline
                </button>
                <button
                  onClick={() => setFillShape(true)}
                  className={`flex-1 h-8 rounded border text-xs font-semibold transition-colors ${
                    fillShape ? "bg-primary/10 border-primary text-primary" : "hover:bg-accent text-muted-foreground"
                  }`}
                >
                  Solid Fill
                </button>
              </div>
            </div>

            {/* Outline style */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Border Style
              </span>
              <select
                value={strokeType}
                onChange={(e) => setStrokeType(e.target.value)}
                className="w-full bg-background border rounded-md px-2.5 py-1.5 text-xs font-medium focus:outline-none"
              >
                <option value="solid">Solid Line</option>
                <option value="dashed">Dashed Line</option>
                <option value="dotted">Dotted Line</option>
              </select>
            </div>
          </div>
        );

      default:
        // Brush, Pencil, Eraser
        return (
          <div className="space-y-4 pt-1">
            {/* Visual Brush Size Preview Circle */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Brush Tip Preview
              </span>
              <div className="flex items-center justify-center h-28 border border-dashed rounded-xl bg-muted/20 relative overflow-hidden">
                <div 
                  className="rounded-full shadow-inner transition-all duration-150"
                  style={{
                    width: `${Math.max(4, Math.min(100, brushSize))}px`,
                    height: `${Math.max(4, Math.min(100, brushSize))}px`,
                    backgroundColor: activeTool === "eraser" ? "#ffffff" : primaryColor,
                    opacity: brushOpacity,
                    border: activeTool === "eraser" ? "1px solid #cbd5e1" : "none"
                  }}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  const getToolIcon = () => {
    switch (activeTool) {
      case "text":
        return <Type className="h-4 w-4" />;
      case "rectangle":
        return <Square className="h-4 w-4" />;
      case "circle":
        return <Circle className="h-4 w-4" />;
      default:
        return <Paintbrush className="h-4 w-4" />;
    }
  };

  return (
    <section className="flex-1 p-4 bg-background flex flex-col min-h-65">
      {/* Title */}
      <div className="flex items-center gap-2 pb-3 border-b mb-3">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <span className="font-sans font-semibold text-xs tracking-wider uppercase text-foreground">
          Tool Properties
        </span>
      </div>

      {/* Tool Type Header */}
      <div className="flex items-center gap-2 mb-3 bg-accent/40 px-2.5 py-1.5 rounded-lg border border-border/50">
        <div className="text-primary">{getToolIcon()}</div>
        <span className="text-xs font-semibold capitalize text-foreground">
          {activeTool} Settings
        </span>
      </div>

      {/* Scrollable Properties Body */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
        {renderToolProperties()}
      </div>
    </section>
  );
}
