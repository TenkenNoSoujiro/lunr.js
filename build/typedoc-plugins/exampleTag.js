"use strict";

const { ConverterComponent, Component } = require("typedoc/dist/lib/converter/components");
const { Converter } = require("typedoc/dist/lib/converter/converter");
const { CommentPlugin } = require("typedoc/dist/lib/converter/plugins");

class ExampleTagPlugin extends ConverterComponent {
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
            const tags = comment.tags.filter(tag => tag.tagName === "example");
            comment.text = tags.reduce((text, tag) => text + format(tag), comment.text);
            CommentPlugin.removeTags(comment, "example");
        }
        function parse(tag) {
            const match = /^\s*<caption>(.*?)<\/caption>(.*)$/is.exec(tag.text);
            if (match) {
                const [, caption, body] = match;
                return { caption: ` &mdash; ${caption}`, body };
            }
            return { caption: "", body: tag.text };
        }
        function format(tag) {
            const parts = parse(tag);
            return `\n#### Example${parts.caption}\n${"```"}typescript${parts.body}${"```"}\n`;
        }
    }
}
Component({ name: "example-tag" })(ExampleTagPlugin);
exports.ExampleTagPlugin = ExampleTagPlugin;