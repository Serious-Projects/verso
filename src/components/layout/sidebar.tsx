"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editor-store";
import { usePageStore } from "@/stores/page-store";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useEditorStore();
  const { pages, createPage, getRootPageIds } = usePageStore();
  const router = useRouter();

  const rootPageIds = useMemo(() => getRootPageIds(), [pages]);
  const favoritePageIds = useMemo(
    () =>
      Object.values(pages)
        .filter((p) => p.isFavorite && !p.isDeleted)
        .map((p) => p.id),
    [pages],
  );

  const handleNewPage = useCallback(() => {
    const id = createPage(null);
    router.push(`/workspace/${id}`);
  }, [createPage, router]);

  return (
    <>
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
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 272, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex h-screen flex-col border-r border-sidebar-border bg-sidebar overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-amber-400 to-amber-600 shadow-sm">
                  <span className="text-[9px] font-black text-white select-none tracking-tighter">
                    V
                  </span>
                </div>
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
              <SidebarButton icon={Search} label="Search" shortcut="⌘K" />
              <SidebarButton icon={Plus} label="New Page" onClick={handleNewPage} />
            </div>

            <div className="mx-3 my-2 border-t border-sidebar-border/40" />

            {/* Pages tree */}
            <ScrollArea className="flex-1 px-2">
              <div className="flex flex-col gap-0.5 pb-4">
                {/* Favorites */}
                {favoritePageIds.length > 0 && (
                  <>
                    <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      Favorites
                    </p>
                    {favoritePageIds.map((id) => (
                      <FavoriteItem key={id} pageId={id} />
                    ))}
                    <div className="my-2 mx-2 border-t border-sidebar-border/40" />
                  </>
                )}

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
        )}
      </AnimatePresence>
    </>
  );
}

function FavoriteItem({ pageId }: { pageId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const page = usePageStore((state) => state.pages[pageId]);
  const pages = usePageStore((state) => state.pages);

  const isActive = pathname === `/workspace/${pageId}`;

  // Build breadcrumb: parent title (if any)
  const parentTitle = page?.parentId ? (pages[page.parentId]?.title ?? null) : null;

  if (!page || page.isDeleted) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/workspace/${pageId}`)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && router.push(`/workspace/${pageId}`)}
      className={`group relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer select-none transition-all duration-150 ${
        isActive
          ? "bg-sidebar-accent/80 text-sidebar-foreground"
          : "hover:bg-muted/40 text-muted-foreground hover:text-sidebar-foreground"
      }`}
    >
      {isActive && (
        <span className="absolute left-0.5 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-primary pointer-events-none" />
      )}
      <span className="shrink-0 text-sm leading-none ml-0.5">{page.icon}</span>
      <span className="flex-1 truncate min-w-0">
        <span className="text-[13px] font-medium">{page.title || "Untitled"}</span>
        {parentTitle && (
          <span className="ml-1.5 text-[10px] text-muted-foreground/40">{parentTitle}</span>
        )}
      </span>
    </div>
  );
}

interface PageTreeItemProps {
  pageId: string;
  depth: number;
  isLast?: boolean;
}

function PageTreeItem({ pageId, depth, isLast = false }: PageTreeItemProps) {
  const router = useRouter();
  const pathname = usePathname();

  const page = usePageStore((state) => state.pages[pageId]);
  const { createPage, deletePage, updatePage, toggleExpanded, toggleFavorite, getRootPageIds } =
    usePageStore();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const renameCancelledRef = useRef(false);

  const isActive = pathname === `/workspace/${pageId}`;
  const hasChildren = (page?.childrenIds.length ?? 0) > 0;

  const handleNavigate = useCallback(() => {
    if (!isRenaming) router.push(`/workspace/${pageId}`);
  }, [isRenaming, pageId, router]);

  const handleToggleExpand = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleExpanded(pageId);
    },
    [pageId, toggleExpanded],
  );

  const handleAddChild = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const newId = createPage(pageId);
      router.push(`/workspace/${newId}`);
    },
    [createPage, pageId, router],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deletePage(pageId);
      if (isActive) {
        const rootIds = getRootPageIds();
        const next = rootIds.find((id) => id !== pageId);
        router.push(next ? `/workspace/${next}` : "/workspace");
      }
    },
    [deletePage, getRootPageIds, isActive, pageId, router],
  );

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavorite(pageId);
    },
    [pageId, toggleFavorite],
  );

  const startRename = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setRenameValue(page?.title ?? "");
      setIsRenaming(true);
      setTimeout(() => renameInputRef.current?.select(), 0);
    },
    [page?.title],
  );

  const commitRename = useCallback(() => {
    if (renameCancelledRef.current) {
      renameCancelledRef.current = false;
      return;
    }
    updatePage(pageId, { title: renameValue.trim() || "Untitled" });
    setIsRenaming(false);
  }, [pageId, renameValue, updatePage]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") commitRename();
      if (e.key === "Escape") {
        renameCancelledRef.current = true;
        setIsRenaming(false);
      }
    },
    [commitRename],
  );

  if (!page || page.isDeleted) return null;

  return (
    <div>
      {/* Outer row: connectors live OUTSIDE the clickable button */}
      <div className="flex items-stretch" style={{ minHeight: "28px" }}>

        {/* Branch connectors — outside the button, absolutely positioned for precision */}
        {depth > 0 &&
          Array.from({ length: depth }).map((_, i) => {
            const isConnector = i === depth - 1;
            return (
              // w-5 (20px) with line at left:12px → 8px horizontal arm, chevron-aligned
              <span key={i} className="shrink-0 w-5 relative" aria-hidden="true">
                {isConnector ? (
                  isLast ? (
                    // L-shape: single element → border-l curves into border-b with no gap
                    <span
                      className="absolute top-0 right-0 border-l-2 border-b-2 border-sidebar-foreground/25 rounded-bl-[5px]"
                      style={{ left: "12px", bottom: "50%" }}
                    />
                  ) : (
                    // T-shape: continuous full-height vertical + separate horizontal arm
                    <>
                      <span
                        className="absolute inset-y-0 border-l-2 border-sidebar-foreground/25"
                        style={{ left: "12px" }}
                      />
                      <span
                        className="absolute right-0 border-b-2 border-sidebar-foreground/25"
                        style={{ left: "12px", top: "50%" }}
                      />
                    </>
                  )
                ) : (
                  /* Ancestor guide: continuous full-height vertical line */
                  <span
                    className="absolute inset-y-0 border-l-2 border-sidebar-foreground/20"
                    style={{ left: "12px" }}
                  />
                )}
              </span>
            );
          })}

        {/* Clickable page row — background stays within this box only */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleNavigate}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleNavigate()}
          data-testid={`page-item-${pageId}`}
          className={`group relative flex-1 min-w-0 flex items-center gap-1 rounded-lg pl-1 pr-1 cursor-pointer select-none transition-all duration-150 ${
            isActive
              ? "bg-sidebar-accent/80 text-sidebar-foreground"
              : "hover:bg-muted/40 text-muted-foreground hover:text-sidebar-foreground"
          }`}
        >
          {isActive && (
            <span className="absolute left-0.5 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-primary pointer-events-none" />
          )}

          {/* Expand toggle */}
          <button
            type="button"
            onClick={handleToggleExpand}
            className={`shrink-0 h-4 flex items-center justify-center rounded-sm transition-all overflow-hidden ${
              hasChildren ? "w-4 hover:bg-muted/80" : "w-0"
            }`}
            tabIndex={-1}
            aria-hidden={!hasChildren}
          >
            <ChevronRight
              className={`h-3 w-3 transition-transform duration-150 ${
                page.isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>

          {/* Icon */}
          <span className="shrink-0 text-sm leading-none">{page.icon}</span>

          {/* Title */}
          {isRenaming ? (
            <input
              ref={renameInputRef}
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent text-[13px] outline-none truncate min-w-0 py-1"
              data-testid={`rename-input-${pageId}`}
            />
          ) : (
            <span
              className="flex-1 text-[13px] font-medium truncate min-w-0 py-1"
              onDoubleClick={startRename}
              data-testid={`page-title-text-${pageId}`}
            >
              {page.title || "Untitled"}
            </span>
          )}

          {/* Hover actions — zero layout width when hidden, expands on hover so title gets full space normally */}
          {!isRenaming && (
            <div className="shrink-0 flex items-center gap-0.5 max-w-0 overflow-hidden opacity-0 group-hover:max-w-18 group-hover:opacity-100 transition-all duration-150">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleFavorite}
                    className={`h-5 w-5 flex items-center justify-center rounded-md transition-colors duration-100 ${
                      page.isFavorite
                        ? "text-amber-500 hover:bg-amber-500/15"
                        : "text-muted-foreground/60 hover:bg-muted/60 hover:text-muted-foreground"
                    }`}
                    tabIndex={-1}
                    data-testid={`favorite-btn-${pageId}`}
                    aria-label={page.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star className="h-3 w-3" fill={page.isFavorite ? "currentColor" : "none"} />
                  </button>
                }
              />
              <TooltipContent side="right">
                {page.isFavorite ? "Unfavorite" : "Favorite"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleAddChild}
                    className="h-5 w-5 flex items-center justify-center rounded-md hover:bg-muted/60 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-100"
                    tabIndex={-1}
                    data-testid={`add-child-btn-${pageId}`}
                    aria-label="Add sub-page"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                }
              />
              <TooltipContent side="right">Add sub-page</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="h-5 w-5 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive transition-colors duration-100"
                    tabIndex={-1}
                    data-testid={`delete-btn-${pageId}`}
                    aria-label="Delete page"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                }
              />
              <TooltipContent side="right">Delete</TooltipContent>
            </Tooltip>
          </div>
        )}
        </div>{/* end clickable row */}
      </div>{/* end flex items-stretch */}

      {/* Children */}
      <AnimatePresence initial={false}>
        {page.isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {page.childrenIds.map((childId, index) => (
              <PageTreeItem
                key={childId}
                pageId={childId}
                depth={depth + 1}
                isLast={index === page.childrenIds.length - 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
