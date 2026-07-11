// src/components/layout/inspector/inspector.tsx
import LayersPanel from "./layers-panel";
import HistoryPanel from "./history-panel";
import PropertiesPanel from "./properties-panel";

export default function Inspector() {
    return (
        <aside className="w-72 border-l bg-zinc-950 flex flex-col">
            <LayersPanel />
            <HistoryPanel />
            <PropertiesPanel />

        </aside>
    );
}