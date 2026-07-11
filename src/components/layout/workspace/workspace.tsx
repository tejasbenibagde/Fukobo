// src/components/layout/workspace/workspace.tsx

import CanvasViewport from "../canvas/canvas-viewpoint";
import Inspector from "../inspector/inspector";
import StatusBar from "../statusbar/statusbar";
import ToolPanel from "../tool-panel/tool-panel";
import Toolbar from "../toolbar/toolbar";


export default function Workspace() {
    return (
        <div className="h-screen w-screen flex flex-col">

            <Toolbar />

            <div className="flex flex-1 overflow-hidden">

                <ToolPanel />

                <CanvasViewport />

                <Inspector />

            </div>

            <StatusBar />

        </div>
    );
}