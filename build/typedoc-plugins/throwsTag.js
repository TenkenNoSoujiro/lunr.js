"use strict";

const { ConverterComponent, Component } = require("typedoc/dist/lib/converter/components");
const { Converter } = require("typedoc/dist/lib/converter/converter");
const { CommentPlugin } = require("typedoc/dist/lib/converter/plugins");

class ThrowsTagPlugin extends ConverterComponent {
    constructor() {
        super(...arguments);
    }
    initialize() {
        this.listenTo(this.owner, {
            [Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
        });
    }
    onBeginResolve(context) {
        for (const { comment } of Object.values(context.project.reflections)) {
            if (!comment || !comment.tags) continue;
            const tags = comment.tags.filter(tag => tag.tagName === "throws");
            comment.text = tags.reduce((text, tag) => text + format(tag), comment.text);
            CommentPlugin.removeTags(comment, "throws");
        }
        function parse(tag) {
            const [, type = "", body] = /^(?:\{([^}]*\}*?)\}(?!\}))?(.*)$/is.exec(tag.text);
            return { type, body };
        }
        function format(tag) {
            const parts = parse(tag);
            return `\n**Throws**${parts.type ? ` ${parts.type}` : ``}\n\n${parts.body}`;
        }
    }
}
Component({ name: "throws-tag" })(ThrowsTagPlugin);
exports.ThrowsTagPlugin = ThrowsTagPlugin;