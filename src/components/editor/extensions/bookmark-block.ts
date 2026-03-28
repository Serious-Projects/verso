import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { BookmarkBlockView } from "../blocks/bookmark-block-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    bookmarkBlock: {
      setBookmarkBlock: (options?: { url?: string }) => ReturnType;
    };
  }
}

export const BookmarkBlock = Node.create({
  name: "bookmarkBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="bookmark-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "bookmark-block" }),
    ];
  },

  addCommands() {
    return {
      setBookmarkBlock:
        (options = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { url: options.url ?? "" },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(BookmarkBlockView);
  },
});
