"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { Download, FileIcon, Pencil } from "lucide-react";
import { useState } from "react";

function extractFilename(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] ?? u.hostname);
  } catch {
    return url.split("/").filter(Boolean).pop() ?? url;
  }
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toUpperCase() : "FILE";
}

export function FileBlockView({ node, updateAttributes }: NodeViewProps) {
  const { url, name } = node.attrs as { url: string; name: string };
  const [inputVal, setInputVal] = useState("");

  const displayName = name || extractFilename(url);

  function submit() {
    const val = inputVal.trim();
    if (!val) return;
    const filename = extractFilename(val);
    updateAttributes({ url: val, name: filename });
  }

  if (!url) {
    return (
      <NodeViewWrapper>
        <div className="my-3 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/40 bg-linear-to-b from-muted/30 to-muted/10 px-8 py-10 transition-all duration-200 hover:border-border/70 hover:from-muted/40 hover:to-muted/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground/40 ring-1 ring-border/30">
            <FileIcon className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground/70">Attach a file</p>
            <p className="mt-0.5 text-xs text-muted-foreground/50">Link to any file via URL</p>
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
              data-testid="file-block-input"
              className="flex-1 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground outline-none backdrop-blur-sm placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={submit}
              data-testid="file-block-embed-btn"
              className="shrink-0 rounded-lg bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary hover:shadow-md active:scale-95"
            >
              Attach
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  const ext = getExtension(displayName);

  return (
    <NodeViewWrapper>
      <div className="group my-3 flex items-center justify-between rounded-xl border border-border/40 bg-linear-to-r from-muted/30 to-muted/10 px-4 py-3.5 shadow-sm ring-1 ring-border/20 transition-all duration-200 hover:shadow-md hover:ring-border/40">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <span className="text-[10px] font-bold text-primary">{ext}</span>
          </div>
          <div className="min-w-0">
            <p
              data-testid="file-block-name"
              className="truncate text-sm font-medium text-foreground"
            >
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground/60">{url}</p>
          </div>
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => {
              updateAttributes({ url: "", name: "" });
              setInputVal("");
            }}
            data-testid="file-block-change-btn"
            className="flex items-center gap-1 rounded-lg p-1.5 text-muted-foreground/50 opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="file-block-download"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Download file"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
