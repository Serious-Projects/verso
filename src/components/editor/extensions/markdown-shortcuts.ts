import { Extension, markInputRule } from "@tiptap/core";

// ==highlight== → highlight mark
const highlightInputRegex = /(?:^|\s)==([^=]+)==$/;

export const MarkdownShortcuts = Extension.create({
  name: "markdownShortcuts",

  addInputRules() {
    const highlightType = this.editor.schema.marks.highlight;
    if (!highlightType) return [];

    return [
      markInputRule({
        find: highlightInputRegex,
        type: highlightType,
      }),
    ];
  },
});
