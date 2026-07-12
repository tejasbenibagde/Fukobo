// src/components/layout/toolbar/toolbar.tsx

import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Toolbar() {
    return (
        <header className="h-12 border-b flex items-center px-3 bg-background">

            <SidebarTrigger />

            <span className="ml-3 font-medium">
                Toolbar
            </span>

        </header>
    );
}