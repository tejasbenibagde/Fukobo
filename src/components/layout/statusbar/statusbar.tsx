// src/components/layout/statusbar/statusbar.tsx

import { useDrawing } from "@/context/drawing-context";
import { Terminal } from "lucide-react";

export default function StatusBar() {
  const { activeTool, primaryColor, brushSize } = useDrawing();

  const getTip = () => {
    switch(activeTool) {
      case 'brush': return "Hold Left Mouse Button to paint smooth soft lines.";
      case 'pencil': return "Sharp non-aliased lines for line art and sketch details.";
      case 'eraser': return "Erase elements back to base white background paper.";
      case 'bucket': return "Flood click to fill the entire active canvas area.";
      case 'picker': return "Click any pixel on canvas to sample color into primary color swatch.";
      case 'rectangle': return "Create perfect custom proportion grid containers.";
      case 'circle': return "Drag bounding radial shapes.";
      case 'text': return "Place text captions anywhere on the canvas grid.";
      default: return "Select any studio tool on left bar to start painting.";
    }
  };

  return (
    <footer className="h-8 border-t bg-background/95 flex items-center justify-between px-4 text-[11px] font-mono select-none">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Terminal className="h-3.5 w-3.5 text-primary" />
        <span>Status: <strong className="text-foreground">Ready</strong></span>
        <span className="text-border">|</span>
        <span className="hidden md:inline italic text-muted-foreground/80">{getTip()}</span>
      </div>

      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="hidden sm:inline">Active Color: <strong className="text-foreground font-semibold">{primaryColor}</strong></span>
        <span className="text-border hidden sm:inline">|</span>
        <span>Tip Size: <strong className="text-foreground font-semibold">{brushSize}px</strong></span>
      </div>
    </footer>
  );
}
