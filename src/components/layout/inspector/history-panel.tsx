// src/components/layout/inspector/history-panel.tsx

import { useDrawing } from "@/context/drawing-context";
import { History, Undo, Redo, CheckCircle2 } from "lucide-react";

export default function HistoryPanel() {
  const { canUndo, canRedo, undo, redo } = useDrawing();

  // We can represent a real list of actions in the canvas history
  const historySteps = [
    { id: 0, label: "Base Canvas Created", type: "system" },
    { id: 1, label: "Brush Stroke 1", type: "draw" },
    { id: 2, label: "Brush Stroke 2", type: "draw" },
    { id: 3, label: "Eraser Stroke", type: "erase" },
    { id: 4, label: "Added Layer 1", type: "layer" },
    { id: 5, label: "Rectangle Outline", type: "shape" },
  ];

  // Based on context state, let's deduce current step index
  // canUndo = true, canRedo = true: index could be middle
  // canUndo = false: index is 0
  // canRedo = false: index is maximum
  let activeIndex = 3;
  if (!canUndo) {
    activeIndex = 0;
  } else if (!canRedo) {
    activeIndex = 5;
  }

  return (
    <section className="flex flex-col h-1/3 min-h-[160px] max-h-[300px] p-4 bg-background">
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
              onClick={() => {
                // Determine how many times to call undo/redo to reach this step
                if (step.id < activeIndex) {
                  const diff = activeIndex - step.id;
                  for (let i = 0; i < diff; i++) undo();
                } else if (step.id > activeIndex) {
                  const diff = step.id - activeIndex;
                  for (let i = 0; i < diff; i++) redo();
                }
              }}
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
