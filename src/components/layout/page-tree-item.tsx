"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Plus, Star, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePageStore } from "@/stores/page-store";

export interface PageTreeItemProps {
  pageId: string;
  depth: number;
  isLast?: boolean;
}

export function PageTreeItem({ pageId, depth, isLast = false }: PageTreeItemProps) {
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
        </div>
        {/* end clickable row */}
      </div>
      {/* end flex items-stretch */}

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
