// src/components/layout/inspector/inspector.tsx
import LayersPanel from "./layers-panel";
import HistoryPanel from "./history-panel";
import PropertiesPanel from "./properties-panel";

export default function Inspector() {
    return (
        <aside className="w-64 h-full border-l">
            <LayersPanel />
            <HistoryPanel />
            <PropertiesPanel />
        </aside>
    );
}