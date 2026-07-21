/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/layout/inspector/history-panel.tsx

import { useDrawing } from "@/context/drawing-context";
import { History, Undo, Redo, CheckCircle2 } from "lucide-react";

interface PanelProps {
  style?: React.CSSProperties;
  className?: string;
}

export default function HistoryPanel({ style, className }: PanelProps = {}) {
  const { fuderuCanvasRef, undo, redo, canUndo, canRedo, syncLayers } = useDrawing();

  const canvas = fuderuCanvasRef.current;
  const undoStack = (canvas?.history as any)?.undoStack || [];
  const redoStack = (canvas?.history as any)?.redoStack || [];

  // Reconstruct chronological action list
  const actions = [...undoStack, ...[...redoStack].reverse()];
  const activeIndex = undoStack.length; // Active index is equal to the length of applied actions

  const getEntryLabel = (entry: any) => {
    if (!entry) return "Action";
    const name = entry.constructor?.name;
    const hasOwn = (obj: any, prop: string) => obj && Object.prototype.hasOwnProperty.call(obj, prop);
    if (name === "CanvasStateHistoryEntry" || hasOwn(entry, "beforeData")) {
      return "Draw Stroke";
    }
    if (name === "LayerCreatedHistoryEntry" || (hasOwn(entry, "layer") && !hasOwn(entry, "index"))) {
      return "Create Layer";
    }
    if (name === "LayerDeletedHistoryEntry" || (hasOwn(entry, "layer") && hasOwn(entry, "index"))) {
      return "Delete Layer";
    }
    if (name === "LayerPropertyHistoryEntry" || hasOwn(entry, "propertyName")) {
      const prop = entry.propertyName || "Property";
      return `Change ${prop.charAt(0).toUpperCase() + prop.slice(1)}`;
    }
    if (name === "MoveLayerHistoryEntry" || hasOwn(entry, "beforeIndex")) {
      return "Reorder Layer";
    }
    return "Edit Canvas";
  };

  const historySteps = [
    { id: 0, label: "Initial Base Canvas" },
    ...actions.map((act, idx) => ({
      id: idx + 1,
      label: `${idx + 1}. ${getEntryLabel(act)}`,
    })),
  ];

  const handleStepClick = (targetId: number) => {
    if (!canvas) return;
    const currentIndex = undoStack.length;
    const diff = currentIndex - targetId;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        canvas.undo();
      }
    } else if (diff < 0) {
      for (let i = 0; i < -diff; i++) {
        canvas.redo();
      }
    }
    syncLayers();
  };

  return (
    <section 
      style={style}
      className={`flex flex-col p-4 bg-background ${className || "h-full min-h-0"}`}
    >
      {/* Title */}
      <div className="flex items-center gap-2 pb-3 border-b mb-3">
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="font-sans font-semibold text-xs tracking-wider uppercase text-foreground">
          History States
        </span>
      </div>

      {/* History Actions List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 py-1 scrollbar-thin">
        {historySteps.map((step) => {
          const isUndone = step.id > activeIndex;
          const isActive = step.id === activeIndex;

          return (
            <div
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              className={`flex items-center gap-2.5 p-1.5 rounded-md cursor-pointer transition-all duration-150 ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary pl-2"
                  : isUndone
                  ? "text-muted-foreground/40 line-through decoration-muted-foreground/20 hover:bg-accent/30"
                  : "hover:bg-accent text-foreground/80"
              }`}
            >
              <CheckCircle2 className={`h-3 w-3 ${isActive ? "text-primary shrink-0" : isUndone ? "text-muted-foreground/20 shrink-0" : "text-muted-foreground/60 shrink-0"}`} />
              <span className="text-xs truncate font-medium">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* History Helper Actions */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t mt-2">
        <span>Click to restore state</span>
        <div className="flex gap-1.5">
          <button 
            onClick={undo}
            disabled={!canUndo}
            className="hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <Undo className="h-3 w-3" />
          </button>
          <button 
            onClick={redo}
            disabled={!canRedo}
            className="hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <Redo className="h-3 w-3" />
          </button>
        </div>
      </div>
    </section>
  );
}
