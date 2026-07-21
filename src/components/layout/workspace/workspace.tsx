// src/components/layout/workspace/workspace.tsx
import CanvasViewport from "../canvas/canvas-viewpoint";
import Inspector from "../inspector/inspector";
import StatusBar from "../statusbar/statusbar";
import ToolPanel from "../tool-panel/tool-panel";
import Toolbar from "../toolbar/toolbar";
import Dashboard from "../dashboard/dashboard";

import { SidebarInset } from "@/components/ui/sidebar";
import { useDrawing } from "@/context/drawing-context";

export default function Workspace() {
    const { isEditorActive } = useDrawing();

    if (!isEditorActive) {
        return <Dashboard />;
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-secondary select-none" >
            <ToolPanel />
            <SidebarInset className="flex flex-col h-full overflow-hidden">
                <Toolbar />
                <main className="flex flex-1 min-h-0 items-stretch justify-between overflow-hidden">
                    <CanvasViewport />
                    <Inspector />
                </main>
                <StatusBar />
            </SidebarInset>
        </div>
    );
}
