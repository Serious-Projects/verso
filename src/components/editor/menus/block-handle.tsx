"use client";

import { Editor } from "@tiptap/react";
import { GripVertical, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function BlockHandle({ editor }: { editor: Editor }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [dropIndicator, setDropIndicator] = useState<{
    top: number;
    visible: boolean;
  }>({ top: 0, visible: false });

  const handleRef = useRef<HTMLDivElement>(null);
  const currentNodePos = useRef<number | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag state — all in refs so re-renders don't interfere
  const isDragging = useRef(false);
  const dragSourcePos = useRef<number | null>(null);
  const dragSourceSize = useRef<number>(0);
  const dragSourceDom = useRef<HTMLElement | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimeout();
    hideTimeout.current = setTimeout(() => {
      if (!handleRef.current?.matches(":hover") && !isDragging.current) {
        setVisible(false);
      }
    }, 300);
  }, [clearHideTimeout]);

  const updatePosition = useCallback(
    (event: MouseEvent) => {
      if (!editor.view?.dom || isDragging.current) return;

      const editorRect = editor.view.dom.getBoundingClientRect();
      const x = editorRect.left + editorRect.width / 2;
      const y = event.clientY;

      const pos = editor.view.posAtCoords({ left: x, top: y });
      if (!pos) {
        scheduleHide();
        return;
      }

      const $pos = editor.state.doc.resolve(pos.pos);
      const blockPos = $pos.depth === 0 ? pos.pos : $pos.before(1);
      const node = editor.state.doc.nodeAt(blockPos);
      if (!node) {
        scheduleHide();
        return;
      }

      const dom = editor.view.nodeDOM(blockPos);
      if (!dom || !(dom instanceof HTMLElement)) {
        scheduleHide();
        return;
      }

      const nodeRect = dom.getBoundingClientRect();
      currentNodePos.current = blockPos;

      clearHideTimeout();
      setPosition({ top: nodeRect.top, left: editorRect.left - 8 });
      setVisible(true);
    },
    [editor, scheduleHide, clearHideTimeout],
  );

  useEffect(() => {
    const editorDom = editor.view?.dom;
    if (!editorDom) return;

    const handleMouseMove = (e: MouseEvent) => updatePosition(e);
    const handleMouseLeave = () => scheduleHide();

    editorDom.addEventListener("mousemove", handleMouseMove);
    editorDom.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      editorDom.removeEventListener("mousemove", handleMouseMove);
      editorDom.removeEventListener("mouseleave", handleMouseLeave);
      clearHideTimeout();
    };
  }, [editor, updatePosition, scheduleHide, clearHideTimeout]);

  const handleAddBlock = useCallback(() => {
    if (currentNodePos.current === null) return;
    const pos = currentNodePos.current;
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;

    const endPos = pos + node.nodeSize;
    editor
      .chain()
      .focus()
      .insertContentAt(endPos, { type: "paragraph" })
      .setTextSelection(endPos + 1)
      .run();
  }, [editor]);

  // ── Mouse-based drag reorder ──────────────────────────────────────────────
  // Uses mousedown/mousemove/mouseup instead of HTML5 DnD to avoid
  // issues with React unmounting the drag source mid-flight.

  const resolveDropTarget = useCallback(
    (clientY: number) => {
      let bestPos = -1;
      let bestDist = Infinity;
      let bestY = 0;

      editor.state.doc.forEach((node, offset) => {
        if (dragSourcePos.current !== null && offset === dragSourcePos.current) {
          return;
        }

        const dom = editor.view.nodeDOM(offset);
        if (!(dom instanceof HTMLElement)) return;
        const rect = dom.getBoundingClientRect();

        const topDist = Math.abs(clientY - rect.top);
        if (topDist < bestDist) {
          bestDist = topDist;
          bestPos = offset;
          bestY = rect.top;
        }

        const bottomDist = Math.abs(clientY - rect.bottom);
        if (bottomDist < bestDist) {
          bestDist = bottomDist;
          bestPos = offset + node.nodeSize;
          bestY = rect.bottom;
        }
      });

      return { insertPos: bestPos, indicatorY: bestY };
    },
    [editor],
  );

  const handleGripMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // prevent text selection during drag
      if (currentNodePos.current === null) return;

      const pos = currentNodePos.current;
      const node = editor.state.doc.nodeAt(pos);
      if (!node) return;

      isDragging.current = true;
      dragSourcePos.current = pos;
      dragSourceSize.current = node.nodeSize;

      // Dim the source block
      const dom = editor.view.nodeDOM(pos);
      if (dom instanceof HTMLElement) {
        dragSourceDom.current = dom;
        dom.style.opacity = "0.3";
        dom.style.transition = "opacity 0.15s ease";
      }

      // Hide the handle
      setVisible(false);

      const handleMouseMove = (ev: MouseEvent) => {
        ev.preventDefault();
        const { indicatorY } = resolveDropTarget(ev.clientY);
        setDropIndicator({ top: indicatorY, visible: true });
      };

      const handleMouseUp = (ev: MouseEvent) => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);

        setDropIndicator({ top: 0, visible: false });
        isDragging.current = false;

        // Restore source block opacity
        if (dragSourceDom.current) {
          dragSourceDom.current.style.opacity = "";
          dragSourceDom.current.style.transition = "";
          dragSourceDom.current = null;
        }

        const sourcePos = dragSourcePos.current;
        const nodeSize = dragSourceSize.current;
        dragSourcePos.current = null;
        dragSourceSize.current = 0;

        if (sourcePos === null) return;

        const sourceNode = editor.state.doc.nodeAt(sourcePos);
        if (!sourceNode) return;

        const { insertPos } = resolveDropTarget(ev.clientY);
        if (insertPos < 0) return;

        // Don't move to same position
        if (insertPos === sourcePos || insertPos === sourcePos + nodeSize) return;

        // Perform the reorder via ProseMirror transaction
        const { tr } = editor.state;
        const nodeContent = sourceNode.toJSON();

        tr.delete(sourcePos, sourcePos + nodeSize);
        const mappedInsert = tr.mapping.map(insertPos);
        tr.insert(mappedInsert, editor.state.schema.nodeFromJSON(nodeContent));

        editor.view.dispatch(tr);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [editor, resolveDropTarget],
  );

  if (!visible && !dropIndicator.visible) return null;

  return (
    <>
      {/* Block handle buttons */}
      {visible && (
        <div
          ref={handleRef}
          className="fixed z-40 flex -translate-x-full items-center gap-0.5 pr-1 transition-opacity"
          style={{ top: position.top, left: position.left }}
          onMouseEnter={clearHideTimeout}
          onMouseLeave={scheduleHide}
        >
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-colors"
            onClick={handleAddBlock}
            title="Add block below"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
            onMouseDown={handleGripMouseDown}
            title="Drag to reorder"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Drop indicator line */}
      {dropIndicator.visible && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: dropIndicator.top - 1,
            left: editor.view?.dom?.getBoundingClientRect().left ?? 0,
            width: editor.view?.dom?.getBoundingClientRect().width ?? 0,
          }}
          data-testid="drop-indicator"
        >
          {/* Main line */}
          <div className="h-0.5 w-full rounded-full bg-primary" />
          {/* Left dot */}
          <div className="absolute -left-1 -top-0.75 h-2 w-2 rounded-full bg-primary" />
          {/* Right dot */}
          <div className="absolute -right-1 -top-0.75 h-2 w-2 rounded-full bg-primary" />
        </div>
      )}
    </>
  );
}
