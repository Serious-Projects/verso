import { Extension } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

/**
 * Moves cursor to the same column in the next row.
 * Returns false if already on the last row.
 */
function moveToCellBelow(
  state: ReturnType<typeof import("@tiptap/core").Editor.prototype.state.doc.resolve>["doc"] extends never ? never : import("@tiptap/pm/state").EditorState,
  dispatch: import("@tiptap/pm/state").Transaction["before"] extends never ? never : ((tr: import("@tiptap/pm/state").Transaction) => void) | undefined,
): boolean {
  const { $from } = state.selection;

  let rowDepth = -1;
  let tableDepth = -1;
  let cellDepth = -1;

  for (let d = $from.depth; d >= 0; d--) {
    const name = $from.node(d).type.name;
    if ((name === "tableCell" || name === "tableHeader") && cellDepth === -1) {
      cellDepth = d;
    } else if (name === "tableRow" && rowDepth === -1) {
      rowDepth = d;
    } else if (name === "table" && tableDepth === -1) {
      tableDepth = d;
    }
  }

  if (cellDepth === -1 || rowDepth === -1 || tableDepth === -1) return false;

  const table = $from.node(tableDepth);
  const rowIndex = $from.index(tableDepth);
  const colIndex = $from.index(rowDepth);

  if (rowIndex >= table.childCount - 1) return false; // last row

  const nextRow = table.child(rowIndex + 1);
  const targetCol = Math.min(colIndex, nextRow.childCount - 1);

  // Calculate absolute position of the target cell's first text position
  const currentRowStart = $from.before(rowDepth);
  const currentRow = $from.node(rowDepth);
  const nextRowStart = currentRowStart + currentRow.nodeSize;

  // +1 = enter the row node, then skip cells to target column
  let pos = nextRowStart + 1;
  for (let c = 0; c < targetCol; c++) {
    pos += nextRow.child(c).nodeSize;
  }
  // +1 = enter cell node, +1 = enter paragraph node
  pos += 2;

  try {
    const resolved = state.doc.resolve(pos);
    if (dispatch) {
      dispatch(state.tr.setSelection(TextSelection.create(state.doc, resolved.pos)));
    }
    return true;
  } catch {
    return false;
  }
}

export const TableKeymap = Extension.create({
  name: "tableKeymap",

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { editor } = this;
        if (!editor.isActive("tableCell") && !editor.isActive("tableHeader")) {
          return false;
        }

        const { state } = editor;
        const { $from } = state.selection;

        // Check if we're on the last row
        let tableDepth = -1;
        for (let d = $from.depth; d >= 0; d--) {
          if ($from.node(d).type.name === "table") { tableDepth = d; break; }
        }

        if (tableDepth !== -1) {
          const table = $from.node(tableDepth);
          const rowIndex = $from.index(tableDepth);

          if (rowIndex >= table.childCount - 1) {
            // Last row — add a new row then move into it
            editor.chain().addRowAfter().run();
            return moveToCellBelow(editor.state, editor.view.dispatch.bind(editor.view));
          }
        }

        return moveToCellBelow(state, editor.view.dispatch.bind(editor.view));
      },

      "Shift-Enter": () => {
        if (!this.editor.isActive("tableCell") && !this.editor.isActive("tableHeader")) {
          return false;
        }
        return this.editor.commands.setHardBreak();
      },
    };
  },
});
