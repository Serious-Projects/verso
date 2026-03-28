"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const widthPx = parseInt(width.replace("w-", "")) * 4;
    setPos({
      top: rect.bottom + 4,
      left: align === "right" ? rect.right - widthPx : rect.left,
    });
  }, [open, align, width]);

  // Close on Escape
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
            <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} />
            <div
              className={`fixed z-50 ${width} rounded-lg border border-border/50 bg-popover/95 shadow-xl backdrop-blur-xl`}
              style={{ top: pos.top, left: pos.left }}
              onClick={(e) => e.stopPropagation()}
              data-testid={testId}
            >
              {children}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

/** Sub-menu that positions itself to the right of its trigger */
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
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.top, left: rect.right + 4 });
  }, [open]);

  return (
    <div ref={triggerRef}>
      {trigger}
      {open &&
        createPortal(
          <div
            className={`fixed z-60 ${width} rounded-lg border border-border/50 bg-popover/95 p-1 shadow-xl backdrop-blur-xl`}
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
