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

  // Find the nearest block boundary for a drop target
  const resolveDropTarget = useCallback(
    (clientY: number) => {
      let bestPos = -1;
      let bestDist = Infinity;
      let bestY = 0;

      editor.state.doc.forEach((node, offset) => {
        // Skip the block being dragged for indicator positioning
        if (dragSourcePos.current !== null && offset === dragSourcePos.current) {
          return;
        }

        const dom = editor.view.nodeDOM(offset);
        if (!(dom instanceof HTMLElement)) return;
        const rect = dom.getBoundingClientRect();

        // Gap above this block
        const topDist = Math.abs(clientY - rect.top);
        if (topDist < bestDist) {
          bestDist = topDist;
          bestPos = offset;
          bestY = rect.top;
        }

        // Gap below this block
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

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (currentNodePos.current === null) return;
      isDragging.current = true;

      const pos = currentNodePos.current;
      const node = editor.state.doc.nodeAt(pos);
      if (!node) return;

      dragSourcePos.current = pos;
      dragSourceSize.current = node.nodeSize;

      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(
        "application/verso-block",
        JSON.stringify({ pos, nodeSize: node.nodeSize }),
      );

      // Visual feedback: dim the source block
      const dom = editor.view.nodeDOM(pos);
      if (dom instanceof HTMLElement) {
        dragSourceDom.current = dom;
        dom.style.opacity = "0.3";
        dom.style.transition = "opacity 0.15s ease";

        // Ghost drag image
        const clone = dom.cloneNode(true) as HTMLElement;
        clone.style.cssText =
          "opacity:0.8;position:absolute;top:-1000px;max-width:500px;pointer-events:none;background:var(--color-muted);border-radius:6px;padding:4px 8px;";
        document.body.appendChild(clone);
        e.dataTransfer.setDragImage(clone, 20, 20);
        requestAnimationFrame(() => document.body.removeChild(clone));
      }

      // Hide the handle during drag
      setVisible(false);
    },
    [editor],
  );

  useEffect(() => {
    const editorDom = editor.view?.dom;
    if (!editorDom) return;

    const handleDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("application/verso-block")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const { indicatorY } = resolveDropTarget(e.clientY);
      setDropIndicator({ top: indicatorY, visible: true });
    };

    const handleDragLeave = (e: DragEvent) => {
      const rect = editorDom.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        setDropIndicator((prev) => ({ ...prev, visible: false }));
      }
    };

    const handleDrop = (e: DragEvent) => {
      const raw = e.dataTransfer?.getData("application/verso-block");
      if (!raw) return;
      e.preventDefault();
      setDropIndicator((prev) => ({ ...prev, visible: false }));
      isDragging.current = false;

      // Restore source block opacity
      if (dragSourceDom.current) {
        dragSourceDom.current.style.opacity = "";
        dragSourceDom.current.style.transition = "";
        dragSourceDom.current = null;
      }

      const { pos: sourcePos, nodeSize } = JSON.parse(raw);
      const sourceNode = editor.state.doc.nodeAt(sourcePos);
      if (!sourceNode) return;

      const { insertPos } = resolveDropTarget(e.clientY);
      if (insertPos < 0) return;

      // Don't move to same position (before or after the source block)
      if (insertPos === sourcePos || insertPos === sourcePos + nodeSize) return;

      // Use proper transaction with mapping
      const { tr } = editor.state;
      const nodeContent = sourceNode.toJSON();

      // Delete the source block first
      tr.delete(sourcePos, sourcePos + nodeSize);

      // Map the insert position through the deletion
      const mappedInsert = tr.mapping.map(insertPos);

      // Insert the node at the mapped position
      tr.insert(mappedInsert, editor.state.schema.nodeFromJSON(nodeContent));

      editor.view.dispatch(tr);
      dragSourcePos.current = null;
      dragSourceSize.current = 0;
    };

    const handleDragEnd = () => {
      isDragging.current = false;
      setDropIndicator((prev) => ({ ...prev, visible: false }));

      // Restore source block opacity if drop didn't happen
      if (dragSourceDom.current) {
        dragSourceDom.current.style.opacity = "";
        dragSourceDom.current.style.transition = "";
        dragSourceDom.current = null;
      }
      dragSourcePos.current = null;
      dragSourceSize.current = 0;
    };

    editorDom.addEventListener("dragover", handleDragOver);
    editorDom.addEventListener("dragleave", handleDragLeave);
    editorDom.addEventListener("drop", handleDrop);
    editorDom.addEventListener("dragend", handleDragEnd);

    return () => {
      editorDom.removeEventListener("dragover", handleDragOver);
      editorDom.removeEventListener("dragleave", handleDragLeave);
      editorDom.removeEventListener("drop", handleDrop);
      editorDom.removeEventListener("dragend", handleDragEnd);
    };
  }, [editor, resolveDropTarget]);

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
            draggable
            onDragStart={handleDragStart}
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
