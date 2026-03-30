"use client";

import { useState } from "react";

import { ICON_CATEGORIES } from "./constants/icons";

interface IconPickerProps {
  currentIcon?: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

export function IconPicker({ currentIcon, onSelect, onClose }: IconPickerProps) {
  const [iconSearch, setIconSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Picker panel */}
      <div
        className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border/50 bg-popover/95 shadow-2xl backdrop-blur-xl ring-1 ring-border/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border/40 px-3 pt-3 pb-2">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Choose icon
          </p>
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M10 10l3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search icons..."
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              className="w-full rounded-lg bg-muted/60 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Category tabs */}
        {!iconSearch && (
          <div className="flex gap-0.5 overflow-x-auto border-b border-border/40 px-2 py-1.5 scrollbar-none">
            {ICON_CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveCategory(i)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
                  activeCategory === i
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Icons grid */}
        <div className="p-2.5">
          {(() => {
            const q = iconSearch.toLowerCase();
            const icons = q
              ? ICON_CATEGORIES.flatMap((c) => c.icons).filter((ic) =>
                  ic.keywords.includes(q),
                )
              : ICON_CATEGORIES[activeCategory].icons;
            return icons.length > 0 ? (
              <div className="grid grid-cols-8 gap-0.5">
                {icons.map((ic) => (
                  <button
                    key={ic.emoji}
                    type="button"
                    onClick={() => onSelect(ic.emoji)}
                    data-testid="icon-button"
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl transition-all duration-100 hover:bg-primary/10 hover:scale-110 ${
                      currentIcon === ic.emoji
                        ? "bg-primary/15 ring-1 ring-primary/30"
                        : ""
                    }`}
                  >
                    {ic.emoji}
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground/50">
                No icons found
              </p>
            );
          })()}
        </div>

        {/* Remove icon footer */}
        <div className="border-t border-border/40 px-3 py-2">
          <button
            type="button"
            onClick={() => onSelect("📄")}
            className="w-full rounded-lg py-1.5 text-xs text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          >
            Reset to default
          </button>
        </div>
      </div>
    </>
  );
}
