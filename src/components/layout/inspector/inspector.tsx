// src/components/layout/inspector/inspector.tsx
import { useDrawing } from "@/context/drawing-context";
import { useState, useRef, useEffect } from "react";
import LayersPanel from "./layers-panel";
import HistoryPanel from "./history-panel";
import PropertiesPanel from "./properties-panel";

export default function Inspector() {
  const { rightPanelOpen } = useDrawing();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Height state in pixels
  const [h1, setH1] = useState<number>(240); // Layer Manager
  const [h3, setH3] = useState<number>(200); // History Panel

  // Active drag state
  const [activeDrag, setActiveDrag] = useState<"divider1" | "divider2" | null>(null);

  useEffect(() => {
    if (!activeDrag) return;

    // Set cursor and user select on document body during drag
    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height;

      const minH1 = 80;
      const minH3 = 80;
      const minH2 = 120; // Properties panel minimum

      if (activeDrag === "divider1") {
        const clientY = e.clientY;
        const maxH1 = containerHeight - h3 - minH2;
        const newH1 = Math.max(minH1, Math.min(maxH1, clientY - rect.top));
        setH1(newH1);
      } else if (activeDrag === "divider2") {
        const clientY = e.clientY;
        const maxH3 = containerHeight - h1 - minH2;
        const newH3 = Math.max(minH3, Math.min(maxH3, rect.bottom - clientY));
        setH3(newH3);
      }
    };

    const handlePointerUp = () => {
      setActiveDrag(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeDrag, h1, h3]);

  return (
    <aside
      className={`h-full bg-background flex flex-col transition-all duration-300 shadow-sm shrink-0 border-l overflow-hidden ${
        rightPanelOpen 
          ? "w-80 opacity-100" 
          : "w-0 opacity-0 pointer-events-none border-l-0"
      }`}
    >
      <div 
        ref={containerRef}
        className="flex flex-col h-full min-w-[320px] overflow-hidden select-none"
      >
        {/* Layer Manager Panel */}
        <LayersPanel style={{ height: `${h1}px` }} className="shrink-0 overflow-hidden" />

        {/* Divider 1 */}
        <div 
          onPointerDown={(e) => {
            e.preventDefault();
            setActiveDrag("divider1");
          }}
          className={`h-2 w-full cursor-ns-resize transition-all duration-150 flex items-center justify-center border-t border-b border-border/40 select-none ${
            activeDrag === "divider1" ? "bg-primary/20" : "bg-muted/40 hover:bg-primary/10"
          }`}
          title="Drag to resize panels"
        >
          {/* Subtle grabber line */}
          <div className="w-8 h-[2px] bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Properties Panel (flex-1 to take the remaining height) */}
        <PropertiesPanel className="flex-1 min-h-0 overflow-hidden" />

        {/* Divider 2 */}
        <div 
          onPointerDown={(e) => {
            e.preventDefault();
            setActiveDrag("divider2");
          }}
          className={`h-2 w-full cursor-ns-resize transition-all duration-150 flex items-center justify-center border-t border-b border-border/40 select-none ${
            activeDrag === "divider2" ? "bg-primary/20" : "bg-muted/40 hover:bg-primary/10"
          }`}
          title="Drag to resize panels"
        >
          {/* Subtle grabber line */}
          <div className="w-8 h-[2px] bg-muted-foreground/30 rounded-full" />
        </div>

        {/* History Panel */}
        <HistoryPanel style={{ height: `${h3}px` }} className="shrink-0 overflow-hidden" />
      </div>
    </aside>
  );
}
