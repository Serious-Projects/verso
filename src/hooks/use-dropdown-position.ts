import { useCallback, useRef, useState } from "react";

const VIEWPORT_PADDING = 8;
const ESTIMATED_DROPDOWN_HEIGHT = 300;

interface Position {
  top: number;
  left: number;
  arrowLeft: number;
}

interface UseDropdownPositionOptions {
  /** Where to align horizontally relative to trigger */
  align?: "left" | "right";
  /** Dropdown width in pixels */
  widthPx: number;
  /** Gap between trigger and dropdown */
  offset?: number;
  /** "below" opens under trigger, "right" opens to the right (for submenus) */
  placement?: "below" | "right";
}

export function useDropdownPosition<T extends HTMLElement = HTMLDivElement>({
  align = "left",
  widthPx,
  offset = 4,
  placement = "below",
}: UseDropdownPositionOptions) {
  const triggerRef = useRef<T>(null);
  const [pos, setPos] = useState<Position>({ top: 0, left: 0, arrowLeft: 16 });

  const recompute = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top: number;
    let left: number;

    if (placement === "right") {
      // Submenu: open to the right, aligned to top of trigger
      left = rect.right + offset;
      top = rect.top;
      // Flip to left if overflows right edge
      if (left + widthPx > vw - VIEWPORT_PADDING) {
        left = rect.left - widthPx - offset;
      }
    } else {
      // Standard dropdown: open below trigger
      left = align === "right" ? rect.right - widthPx : rect.left;

      // Prefer below, flip to top if insufficient space
      const spaceBelow = vh - rect.bottom - offset;
      const spaceAbove = rect.top - offset;
      if (spaceBelow >= ESTIMATED_DROPDOWN_HEIGHT || spaceBelow >= spaceAbove) {
        top = rect.bottom + offset;
      } else {
        top = rect.top - offset - Math.min(ESTIMATED_DROPDOWN_HEIGHT, spaceAbove);
      }
    }

    // Clamp to viewport
    left = Math.max(VIEWPORT_PADDING, Math.min(left, vw - widthPx - VIEWPORT_PADDING));
    top = Math.max(VIEWPORT_PADDING, Math.min(top, vh - VIEWPORT_PADDING));

    // Center dropdown horizontally under trigger, then clamp
    if (placement === "below") {
      const centered = rect.left + rect.width / 2 - widthPx / 2;
      left = Math.max(VIEWPORT_PADDING, Math.min(centered, vw - widthPx - VIEWPORT_PADDING));
    }

    // Arrow points at trigger center, relative to dropdown left
    const triggerCenter = rect.left + rect.width / 2;
    const arrowLeft = Math.max(12, Math.min(triggerCenter - left, widthPx - 12));

    setPos({ top, left, arrowLeft });
  }, [align, widthPx, offset, placement]);

  return { triggerRef, pos, recompute };
}
