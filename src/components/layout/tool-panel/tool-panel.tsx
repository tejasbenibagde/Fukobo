// src/components/layout/tool-panel/tool-panel.tsx

import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarTrigger,
} from "@/components/ui/sidebar";

export default function ToolPanel() {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="flex items-center">
                <SidebarTrigger />
            </SidebarHeader>

            <SidebarContent>
                ...
            </SidebarContent>
        </Sidebar>
    );
}