"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileText, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { usePageStore } from "@/stores/page-store";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const pages = usePageStore((state) => state.pages);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(pages)
      .filter((p) => !p.isDeleted)
      .filter((p) => !q || p.title.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 12);
  }, [pages, query]);

  // Reset on open + focus input
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handler, true); // capture phase
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, onClose]);

  // Clamp selected index
  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(results.length - 1, 0)));
  }, [results.length]);

  // Scroll selected result into view during keyboard navigation
  useEffect(() => {
    const id = results[selectedIndex]?.id;
    if (!id) return;
    document.getElementById(`search-result-option-${id}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, results]);

  const navigate = (pageId: string) => {
    router.push(`/workspace/${pageId}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      if (results.length === 0) return;
      e.preventDefault();
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      if (results.length === 0) return;
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      const selected = results[selectedIndex];
      if (selected) navigate(selected.id);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            data-testid="search-backdrop"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-md -translate-x-1/2"
            data-testid="search-modal"
          >
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-popover shadow-2xl">
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages..."
                  role="combobox"
                  aria-expanded={results.length > 0}
                  aria-controls="search-results-listbox"
                  aria-activedescendant={
                    results[selectedIndex]
                      ? `search-result-option-${results[selectedIndex].id}`
                      : undefined
                  }
                  className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none"
                  data-testid="search-input"
                />
                <kbd className="text-[10px] text-muted-foreground/40 font-mono border border-border/50 rounded px-1.5 py-0.5">
                  esc
                </kbd>
              </div>

              {/* Results */}
              <div
                id="search-results-listbox"
                role="listbox"
                className="max-h-72 overflow-y-auto py-1.5"
                data-testid="search-results"
              >
                {results.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-muted-foreground/50">
                    No pages found
                  </p>
                ) : (
                  results.map((page, index) => (
                    <button
                      key={page.id}
                      id={`search-result-option-${page.id}`}
                      type="button"
                      role="option"
                      aria-selected={index === selectedIndex}
                      onClick={() => navigate(page.id)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75 ${
                        index === selectedIndex
                          ? "bg-sidebar-accent/80 text-sidebar-foreground"
                          : "text-muted-foreground hover:bg-muted/40"
                      }`}
                      data-testid={`search-result-${page.id}`}
                    >
                      <span className="shrink-0 text-base leading-none">{page.icon}</span>
                      <span className="flex-1 truncate text-[13px] font-medium">
                        {page.title || "Untitled"}
                      </span>
                      <FileText className="h-3.5 w-3.5 shrink-0 opacity-30" />
                    </button>
                  ))
                )}
              </div>

              {/* Footer hint */}
              {results.length > 0 && (
                <div className="border-t border-border/40 px-4 py-2 flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground/40 font-mono">
                    ↑↓ navigate
                  </span>
                  <span className="text-[10px] text-muted-foreground/40 font-mono">↵ open</span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
