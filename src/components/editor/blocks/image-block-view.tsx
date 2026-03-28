"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { ImageIcon, Pencil } from "lucide-react";
import { useRef, useState } from "react";

export function ImageBlockView({ node, updateAttributes }: NodeViewProps) {
  const { src, alt } = node.attrs as { src: string; alt: string };

  const [inputVal, setInputVal] = useState("");
  const [imgError, setImgError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const val = inputVal.trim();
    if (val) {
      updateAttributes({ src: val });
      setImgError(false);
    }
  }

  if (!src) {
    return (
      <NodeViewWrapper>
        <div className="my-3 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/40 bg-linear-to-b from-muted/30 to-muted/10 px-8 py-10 transition-all duration-200 hover:border-border/70 hover:from-muted/40 hover:to-muted/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground/40 ring-1 ring-border/30">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground/70">Add an image</p>
            <p className="mt-0.5 text-xs text-muted-foreground/50">Paste a URL to embed</p>
          </div>
          <div className="flex w-full max-w-sm gap-2">
            <input
              ref={inputRef}
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
              data-testid="image-block-input"
              className="flex-1 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground outline-none backdrop-blur-sm placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={submit}
              data-testid="image-block-embed-btn"
              className="shrink-0 rounded-lg bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary hover:shadow-md active:scale-95"
            >
              Embed
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  if (imgError) {
    return (
      <NodeViewWrapper>
        <div className="my-3 flex flex-col items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-8 py-8 text-center">
          <span className="text-3xl">🖼️</span>
          <div>
            <p data-testid="image-block-error" className="text-sm font-medium text-destructive/80">
              Could not load image
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              The URL may be invalid or the image is unavailable
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              updateAttributes({ src: "" });
              setImgError(false);
              setInputVal(src);
            }}
            data-testid="image-block-error-change-btn"
            className="rounded-lg border border-destructive/20 bg-background px-4 py-1.5 text-xs font-medium text-destructive/70 transition-all hover:border-destructive/40 hover:text-destructive"
          >
            Change URL
          </button>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <div className="group relative my-3 overflow-hidden rounded-xl ring-1 ring-border/20 shadow-sm transition-all duration-200 hover:shadow-md hover:ring-border/40">
        <img
          src={src}
          alt={alt}
          data-testid="image-block-img"
          className="max-h-150 w-full object-cover"
          onError={() => setImgError(true)}
        />
        <button
          type="button"
          onClick={() => {
            updateAttributes({ src: "" });
            setInputVal("");
            setImgError(false);
          }}
          data-testid="image-block-change-btn"
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 hover:bg-black/70"
        >
          <Pencil className="h-3 w-3" />
          Change
        </button>
      </div>
    </NodeViewWrapper>
  );
}
