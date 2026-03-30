"use client";

import { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, RotateCcw, Trash2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePageStore } from "@/stores/page-store";

export interface TrashSectionProps {
  deletedPageIds: string[];
  trashOpen: boolean;
  onToggleTrash: () => void;
}

export function TrashSection({ deletedPageIds, trashOpen, onToggleTrash }: TrashSectionProps) {
  if (deletedPageIds.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggleTrash}
        className="flex w-full items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors"
        data-testid="trash-toggle"
      >
        <Trash2 className="h-3 w-3" />
        <span>Trash</span>
        <ChevronRight
          className={`h-2.5 w-2.5 ml-auto transition-transform duration-150 ${trashOpen ? "rotate-90" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {trashOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
            data-testid="trash-section"
          >
            {deletedPageIds.map((id) => (
              <TrashItem key={id} pageId={id} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrashItem({ pageId }: { pageId: string }) {
  const { page, restorePage, permanentlyDeletePage } = usePageStore(
    useShallow((state) => ({
      page: state.pages[pageId],
      restorePage: state.restorePage,
      permanentlyDeletePage: state.permanentlyDeletePage,
    })),
  );
  const [isConfirming, setIsConfirming] = useState(false);

  // Auto-cancel the confirmation after 3 s if the user doesn't act
  useEffect(() => {
    if (!isConfirming) return;
    const t = setTimeout(() => setIsConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [isConfirming]);

  if (!page) return null;

  return (
    <div
      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 mx-1 hover:bg-muted/30 transition-colors"
      data-testid={`trash-item-${pageId}`}
    >
      <span className="shrink-0 text-sm leading-none opacity-60">{page.icon}</span>
      <span className="flex-1 truncate text-[12px] text-muted-foreground/60 min-w-0">
        {page.title || "Untitled"}
      </span>

      {/* Actions — always visible while confirming, hover-only otherwise */}
      <div
        className={`shrink-0 flex items-center gap-0.5 transition-opacity ${
          isConfirming ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {isConfirming ? (
          <>
            <span className="text-[10px] text-destructive/80 font-medium mr-0.5 select-none">
              Sure?
            </span>
            <button
              type="button"
              onClick={() => permanentlyDeletePage(pageId)}
              className="h-5 px-1.5 flex items-center justify-center rounded-md bg-destructive/10 text-destructive text-[10px] font-medium hover:bg-destructive/20 transition-colors"
              data-testid={`perm-delete-confirm-btn-${pageId}`}
              aria-label="Confirm delete forever"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              className="h-5 px-1.5 flex items-center justify-center rounded-md text-muted-foreground/60 text-[10px] font-medium hover:bg-muted/60 transition-colors"
              data-testid={`perm-delete-cancel-btn-${pageId}`}
              aria-label="Cancel"
            >
              No
            </button>
          </>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => restorePage(pageId)}
                    className="h-5 w-5 flex items-center justify-center rounded-md hover:bg-muted/60 text-muted-foreground/60 hover:text-green-600 transition-colors"
                    data-testid={`restore-btn-${pageId}`}
                    aria-label="Restore page"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                }
              />
              <TooltipContent side="right">Restore</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => setIsConfirming(true)}
                    className="h-5 w-5 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive transition-colors"
                    data-testid={`perm-delete-btn-${pageId}`}
                    aria-label="Delete forever"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                }
              />
              <TooltipContent side="right">Delete forever</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
