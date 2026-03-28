"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { BookmarkIcon, ExternalLink, Pencil } from "lucide-react";
import { useState } from "react";

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function BookmarkBlockView({ node, updateAttributes }: NodeViewProps) {
  const { url } = node.attrs as { url: string };
  const [inputVal, setInputVal] = useState("");

  function submit() {
    const val = inputVal.trim();
    if (!val) return;
    const normalized = val.startsWith("http") ? val : `https://${val}`;
    updateAttributes({ url: normalized });
  }

  if (!url) {
    return (
      <NodeViewWrapper>
        <div className="my-3 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/40 bg-linear-to-b from-muted/30 to-muted/10 px-8 py-10 transition-all duration-200 hover:border-border/70 hover:from-muted/40 hover:to-muted/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground/40 ring-1 ring-border/30">
            <BookmarkIcon className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground/70">Add a web bookmark</p>
            <p className="mt-0.5 text-xs text-muted-foreground/50">Save any URL as a link card</p>
          </div>
          <div className="flex w-full max-w-sm gap-2">
            <input
              type="url"
              placeholder="https://..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              data-testid="bookmark-block-input"
              className="flex-1 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground outline-none backdrop-blur-sm placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={submit}
              data-testid="bookmark-block-save-btn"
              className="shrink-0 rounded-lg bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary hover:shadow-md active:scale-95"
            >
              Save
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <div className="group relative my-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="bookmark-block-card"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-between rounded-xl border border-border/40 bg-linear-to-r from-muted/30 to-muted/10 px-5 py-4 no-underline shadow-sm ring-1 ring-border/20 transition-all duration-200 hover:shadow-md hover:ring-border/40"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <BookmarkIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p
                data-testid="bookmark-block-url"
                className="truncate text-sm font-medium text-foreground"
              >
                {url}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/60">{getDomain(url)}</p>
            </div>
          </div>
          <ExternalLink className="ml-3 h-4 w-4 shrink-0 text-muted-foreground/50" />
        </a>
        <button
          type="button"
          onClick={() => {
            updateAttributes({ url: "" });
            setInputVal("");
          }}
          data-testid="bookmark-block-change-btn"
          className="absolute right-3 top-3 flex items-center gap-1 rounded-lg p-1.5 text-muted-foreground/40 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </NodeViewWrapper>
  );
}
