"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { Pencil, PlayCircle } from "lucide-react";
import { useState } from "react";

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      const vid = u.pathname.slice(1);
      if (vid) return `https://www.youtube.com/embed/${vid}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const vid = u.pathname.split("/").filter(Boolean)[0];
      if (vid && /^\d+$/.test(vid)) return `https://player.vimeo.com/video/${vid}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function VideoBlockView({ node, updateAttributes }: NodeViewProps) {
  const { src } = node.attrs as { src: string };

  const [inputVal, setInputVal] = useState("");
  const [embedError, setEmbedError] = useState(false);

  const embedUrl = src ? getEmbedUrl(src) : null;

  function submit() {
    const val = inputVal.trim();
    if (!val) return;
    const url = getEmbedUrl(val);
    if (!url) {
      setEmbedError(true);
      return;
    }
    setEmbedError(false);
    updateAttributes({ src: val });
  }

  if (!src) {
    return (
      <NodeViewWrapper>
        <div className="my-3 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/40 bg-linear-to-b from-muted/30 to-muted/10 px-8 py-10 transition-all duration-200 hover:border-border/70 hover:from-muted/40 hover:to-muted/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground/40 ring-1 ring-border/30">
            <PlayCircle className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground/70">Embed a video</p>
            <p className="mt-0.5 text-xs text-muted-foreground/50">YouTube and Vimeo supported</p>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setEmbedError(false);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                data-testid="video-block-input"
                className="flex-1 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground outline-none backdrop-blur-sm placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={submit}
                data-testid="video-block-embed-btn"
                className="shrink-0 rounded-lg bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary hover:shadow-md active:scale-95"
              >
                Embed
              </button>
            </div>
            {embedError && (
              <p data-testid="video-block-error" className="text-xs text-destructive/80">
                Not a valid YouTube or Vimeo URL
              </p>
            )}
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <div className="group relative my-3 overflow-hidden rounded-xl ring-1 ring-border/20 shadow-sm transition-all duration-200 hover:shadow-md hover:ring-border/40">
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={embedUrl ?? ""}
            data-testid="video-block-iframe"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <button
          type="button"
          onClick={() => {
            updateAttributes({ src: "" });
            setInputVal("");
            setEmbedError(false);
          }}
          data-testid="video-block-change-btn"
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 hover:bg-black/70"
        >
          <Pencil className="h-3 w-3" />
          Change
        </button>
      </div>
    </NodeViewWrapper>
  );
}
