// src/components/layout/workspace/workspace.tsx
import CanvasViewport from "../canvas/canvas-viewpoint";
import Inspector from "../inspector/inspector";
import StatusBar from "../statusbar/statusbar";
import ToolPanel from "../tool-panel/tool-panel";
import Toolbar from "../toolbar/toolbar";

import { SidebarInset } from "@/components/ui/sidebar";

export default function Workspace() {
    return (
        <div className="flex max-h-screen w-full bg-secondary" >
            <ToolPanel />
            <SidebarInset className="flex flex-col">
                <Toolbar />
                <main className="flex h-full items-center justify-between">
                    <CanvasViewport />
                    <Inspector />
                </main>
                <StatusBar />

            </SidebarInset>
        </div>
    );
}