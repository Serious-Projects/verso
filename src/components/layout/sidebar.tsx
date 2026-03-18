"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editor-store";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useEditorStore();

  return (
    <>
      {/* Collapsed toggle */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-3 top-3 z-50"
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleSidebar}
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                }
              />
              <TooltipContent side="right">Open sidebar</TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex h-screen flex-col border-r border-sidebar-border bg-sidebar overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
                Verso
              </span>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={toggleSidebar}
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </Button>
                  }
                />
                <TooltipContent side="right">Close sidebar</TooltipContent>
              </Tooltip>
            </div>

            {/* Quick actions */}
            <div className="flex flex-col gap-0.5 px-2">
              <SidebarButton icon={Search} label="Search" shortcut="Ctrl+K" />
              <SidebarButton icon={Plus} label="New Page" />
            </div>

            <Separator className="my-2" />

            {/* Pages list */}
            <ScrollArea className="flex-1 px-2">
              <div className="flex flex-col gap-0.5">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Pages
                </p>
                <SidebarPageItem title="Getting Started" active />
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-sidebar-border px-3 py-2">
              <ThemeToggle />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  }
                />
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarButton({
  icon: Icon,
  label,
  shortcut,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
}) {
  return (
    <Button
      variant="ghost"
      className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal text-muted-foreground hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="text-xs text-muted-foreground/60">{shortcut}</span>
      )}
    </Button>
  );
}

function SidebarPageItem({
  title,
  active,
}: {
  title: string;
  active?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      className={`h-8 w-full justify-start gap-2 px-2 text-sm font-normal ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <FileText className="h-4 w-4" />
      <span className="truncate">{title}</span>
    </Button>
  );
}
