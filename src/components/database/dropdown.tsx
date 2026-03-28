"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { useDropdownPosition } from "@/hooks/use-dropdown-position";

const TW_WIDTH_TO_PX: Record<string, number> = {
  "w-28": 112,
  "w-32": 128,
  "w-36": 144,
  "w-40": 160,
  "w-44": 176,
  "w-52": 208,
  "w-56": 224,
  "w-64": 256,
  "w-72": 288,
  "w-80": 320,
};

function resolveWidth(tw: string): number {
  if (TW_WIDTH_TO_PX[tw]) return TW_WIDTH_TO_PX[tw];
  const match = tw.match(/^w-(\d+)$/);
  return match ? parseInt(match[1]) * 4 : 224; // fallback to w-56
}

interface DropdownProps {
  trigger: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: "left" | "right";
  width?: string;
  children: React.ReactNode;
  testId?: string;
  className?: string;
}

export function Dropdown({
  trigger,
  open,
  onOpenChange,
  align = "left",
  width = "w-56",
  children,
  testId,
  className,
}: DropdownProps) {
  const widthPx = resolveWidth(width);
  const { triggerRef, pos, recompute } = useDropdownPosition<HTMLDivElement>({
    align,
    widthPx,
  });

  useEffect(() => {
    if (open) recompute();
  }, [open, recompute]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  return (
    <div ref={triggerRef} className={className ?? "relative h-full"}>
      {trigger}
      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-60" onClick={() => onOpenChange(false)} />
            <div
              className={`fixed z-70 ${width} rounded-lg border border-border/50 bg-popover/95 shadow-xl backdrop-blur-xl`}
              style={{ top: pos.top, left: pos.left }}
              onClick={(e) => e.stopPropagation()}
              data-testid={testId}
            >
              <div
                className="absolute -top-1.25 h-2.5 w-2.5 rotate-45 border-l border-t border-border/50 bg-popover/95"
                style={{ left: pos.arrowLeft - 5 }}
              />
              {children}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

interface SubMenuProps {
  trigger: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width?: string;
  children: React.ReactNode;
  testId?: string;
}

export function SubMenu({
  trigger,
  open,
  onOpenChange,
  width = "w-44",
  children,
  testId,
}: SubMenuProps) {
  const widthPx = resolveWidth(width);
  const { triggerRef, pos, recompute } = useDropdownPosition<HTMLDivElement>({
    widthPx,
    placement: "right",
  });

  useEffect(() => {
    if (open) recompute();
  }, [open, recompute]);

  return (
    <div ref={triggerRef}>
      {trigger}
      {open &&
        createPortal(
          <div
            className={`fixed z-80 ${width} rounded-lg border border-border/50 bg-popover/95 p-1 shadow-xl backdrop-blur-xl`}
            style={{ top: pos.top, left: pos.left }}
            onClick={(e) => e.stopPropagation()}
            data-testid={testId}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}
