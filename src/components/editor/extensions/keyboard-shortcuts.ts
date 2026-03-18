import { Extension } from "@tiptap/core";

export const KeyboardShortcuts = Extension.create({
  name: "versoKeyboardShortcuts",

  addKeyboardShortcuts() {
    return {
      // Block type shortcuts (Notion-compatible)
      "Mod-Shift-0": () => this.editor.commands.setParagraph(),
      "Mod-Shift-1": () =>
        this.editor.commands.toggleHeading({ level: 1 }),
      "Mod-Shift-2": () =>
        this.editor.commands.toggleHeading({ level: 2 }),
      "Mod-Shift-3": () =>
        this.editor.commands.toggleHeading({ level: 3 }),
      "Mod-Shift-4": () => this.editor.commands.toggleBulletList(),
      "Mod-Shift-5": () => this.editor.commands.toggleOrderedList(),
      "Mod-Shift-6": () => this.editor.commands.toggleTaskList(),
      "Mod-Shift-7": () => this.editor.commands.toggleCodeBlock(),
      "Mod-Shift-8": () => this.editor.commands.toggleBlockquote(),

      // Formatting shortcuts
      "Mod-Shift-h": () => this.editor.commands.toggleHighlight(),
      "Mod-Shift-s": () => this.editor.commands.toggleStrike(),

      // Divider
      "Mod-Shift-d": () => this.editor.commands.setHorizontalRule(),

      // Duplicate block
      "Mod-d": () => {
        const { state } = this.editor;
        const { $from } = state.selection;
        const blockStart = $from.before(1);
        const blockEnd = $from.after(1);
        const node = state.doc.nodeAt(blockStart);
        if (!node) return false;

        this.editor
          .chain()
          .insertContentAt(blockEnd, node.toJSON())
          .run();
        return true;
      },

      // Delete block
      "Mod-Shift-Backspace": () => {
        const { state } = this.editor;
        const { $from } = state.selection;
        const blockStart = $from.before(1);
        const blockEnd = $from.after(1);

        this.editor
          .chain()
          .deleteRange({ from: blockStart, to: blockEnd })
          .run();
        return true;
      },
    };
  },
});
