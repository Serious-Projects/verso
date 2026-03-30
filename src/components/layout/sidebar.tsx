"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import {
  PanelLeft,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { FavoritesSection } from "@/components/layout/favorites-section";
import { PageTreeItem } from "@/components/layout/page-tree-item";
import { TrashSection } from "@/components/layout/trash-section";
import { SearchModal } from "@/components/search-modal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MOBILE_BREAKPOINT, SIDEBAR_WIDTH } from "@/lib/constants";
import { useEditorStore } from "@/stores/editor-store";
import { usePageStore } from "@/stores/page-store";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useEditorStore();
  const { pages, createPage, getRootPageIds } = usePageStore();
  const router = useRouter();

  const navigateTo = useCallback(
    (path: string) => {
      router.push(path);
      // Close sidebar on mobile after navigation
      if (window.innerWidth < MOBILE_BREAKPOINT) setSidebarOpen(false);
    },
    [router, setSidebarOpen],
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);

  const rootPageIds = useMemo(() => getRootPageIds(), [pages]);
  const favoritePageIds = useMemo(
    () =>
      Object.values(pages)
        .filter((p) => p.isFavorite && !p.isDeleted)
        .map((p) => p.id),
    [pages],
  );
  const deletedPageIds = useMemo(
    () =>
      Object.values(pages)
        .filter((p) => p.isDeleted)
        .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
        .map((p) => p.id),
    [pages],
  );

  const searchShortcut =
    typeof navigator !== "undefined" && /mac/i.test(navigator.platform) ? "⌘K" : "Ctrl+K";

  const handleNewPage = useCallback(() => {
    const id = createPage(null);
    router.push(`/workspace/${id}`);
  }, [createPage, router]);

  // Cmd+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Collapsed toggle */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="fixed left-3 top-3 z-50"
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-border/60 bg-background/90 shadow-sm backdrop-blur-sm hover:border-border hover:shadow-md transition-all duration-150"
                    onClick={toggleSidebar}
                    aria-label="Open sidebar"
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

      {/* Sidebar panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={toggleSidebar}
            />
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: SIDEBAR_WIDTH, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed z-50 md:relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border/50">
              <div className="flex items-center gap-2">
                <img
                  src="/images/only-logo-no-text.png"
                  alt="Verso logo"
                  className="h-6 w-6 shrink-0 object-contain"
                />
                <span className="text-[13px] font-semibold text-sidebar-foreground tracking-tight">
                  Verso
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/40 transition-all duration-150"
                      onClick={toggleSidebar}
                      aria-label="Close sidebar"
                    >
                      <PanelLeftClose className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <TooltipContent side="right">Close sidebar</TooltipContent>
              </Tooltip>
            </div>

            {/* Quick actions */}
            <div className="flex flex-col gap-0.5 px-2 pt-2">
              <SidebarButton icon={Search} label="Search" shortcut={searchShortcut} onClick={() => setSearchOpen(true)} />
              <SidebarButton icon={Plus} label="New Page" onClick={handleNewPage} />
            </div>

            <div className="mx-3 my-2 border-t border-sidebar-border/40" />

            {/* Pages tree */}
            <ScrollArea className="flex-1 px-2">
              <div className="flex flex-col gap-0.5 pb-4">
                {/* Favorites */}
                <FavoritesSection favoritePageIds={favoritePageIds} />

                {/* All pages */}
                <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Pages
                </p>
                {rootPageIds.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-muted-foreground/60">No pages yet</p>
                ) : (
                  rootPageIds.map((id, index) => (
                    <PageTreeItem
                      key={id}
                      pageId={id}
                      depth={0}
                      isLast={index === rootPageIds.length - 1}
                    />
                  ))
                )}

                {/* Trash section */}
                <TrashSection
                  deletedPageIds={deletedPageIds}
                  trashOpen={trashOpen}
                  onToggleTrash={() => setTrashOpen((v) => !v)}
                />
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-sidebar-border/50 px-2 py-2">
              <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-sidebar-accent/50 cursor-pointer transition-colors duration-150 group">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-amber-300/60 to-amber-500/80 text-[10px] font-bold text-amber-900 dark:from-amber-500/25 dark:to-amber-600/50 dark:text-amber-300 select-none">
                  N
                </div>
                <p className="flex-1 min-w-0 text-[12px] font-medium text-sidebar-foreground truncate">
                  My Workspace
                </p>
                <div className="flex items-center gap-0.5 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                  <ThemeToggle />
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:text-foreground transition-colors"
                          aria-label="Settings"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <TooltipContent side="right">Settings</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className="h-8 w-full justify-start gap-2.5 px-3 text-[13px] font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-muted/40 rounded-lg transition-all duration-150"
      onClick={onClick}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <kbd className="text-[10px] text-muted-foreground/40 font-mono tracking-tight">
          {shortcut}
        </kbd>
      )}
    </Button>
  );
}
