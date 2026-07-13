import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuAction,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Pencil,
  Eraser,
  Square,
  Circle,
  Type,
  Image,
  Undo2,
  Redo2,
  Download,
  Settings,
  ChevronLeft,
} from "lucide-react";

export default function ToolPanel() {
  return (
    <Sidebar collapsible="icon" side="left" className="border-r">
      <SidebarHeader className="flex items-end w-full">
        <SidebarTrigger>
          <ChevronLeft className="h-4 w-4" />
        </SidebarTrigger>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Pencil">
                <button>
                  <Pencil className="h-4 w-4" />
                  <span>Pencil</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Eraser">
                <button>
                  <Eraser className="h-4 w-4" />
                  <span>Eraser</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Rectangle">
                <button>
                  <Square className="h-4 w-4" />
                  <span>Rectangle</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Circle">
                <button>
                  <Circle className="h-4 w-4" />
                  <span>Circle</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Text">
                <button>
                  <Type className="h-4 w-4" />
                  <span>Text</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Image">
                <button>
                  <Image className="h-4 w-4" />
                  <span>Image</span>
                </button>
              </SidebarMenuButton>
              <SidebarMenuBadge>3</SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Undo">
                <button>
                  <Undo2 className="h-4 w-4" />
                  <span>Undo</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Redo">
                <button>
                  <Redo2 className="h-4 w-4" />
                  <span>Redo</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Export">
                <button>
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </SidebarMenuButton>
              <SidebarMenuAction>
                <Settings className="h-3 w-3" />
                <span className="sr-only">Export Settings</span>
              </SidebarMenuAction>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <button>
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
