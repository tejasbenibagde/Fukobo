// src/components/layout/inspector/inspector.tsx
import { useDrawing } from "@/context/drawing-context";
import LayersPanel from "./layers-panel";
import HistoryPanel from "./history-panel";
import PropertiesPanel from "./properties-panel";

export default function Inspector() {
    const { rightPanelOpen } = useDrawing();

    return (
        <aside
            className={`h-full bg-background flex flex-col transition-all duration-300 shadow-sm shrink-0 border-l ${rightPanelOpen
                    ? "w-80 opacity-100"
                    : "w-0 opacity-0 pointer-events-none border-l-0 overflow-hidden"
                }`}
        >
            <div className="flex flex-col h-full divide-y divide-border min-w-[320px]">
                {/* Layer Manager Panel */}
                <LayersPanel />

                {/* Properties Panel */}
                <PropertiesPanel />

                {/* History Panel */}
                <HistoryPanel />
            </div>
        </aside>
    );
}
