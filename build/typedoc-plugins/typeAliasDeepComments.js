"use strict";

const { ConverterComponent, Component } = require("typedoc/dist/lib/converter/components");
const { ReflectionKind } = require("typedoc/dist/lib/models/reflections");
const { Converter } = require("typedoc/dist/lib/converter/converter");
const { ProjectReflection, ParameterReflection } = require("typedoc/dist/lib/models/reflections");
const { Comment } = require("typedoc/dist/lib/models/comments");
const { CommentPlugin } = require("typedoc/dist/lib/converter/plugins");

class TypeAliasDeepCommentsPlugin extends ConverterComponent {
    constructor() {
        super(...arguments);
    }
    initialize() {
        this.listenTo(this.owner, {
            [Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
        }, 513);
    }
    onBeginResolve(context) {
        for (const reflection of Object.values(context.project.reflections)) {
            if (!reflection.comment && reflection.kind === ReflectionKind.Parameter) {
                findDeepComment(reflection);
            }
        }

        function findDeepComment(reflection) {
            let target = reflection.parent;
            while (target && !(target instanceof ProjectReflection)) {
                if (target.kind === ReflectionKind.TypeAlias && target.comment) {
                    const tag = target.comment.getTag("param", reflection.name);
                    if (tag) {
                        const index = target.comment.tags.indexOf(tag);
                        target.comment.tags.splice(index, 1);
                        reflection.comment = new Comment("", tag.text);
                        break;
                    }
                }
                target = target.parent;
            }
        }
    }
}
Component({ name: "type-alias-deep-comments" })(TypeAliasDeepCommentsPlugin);
exports.TypeAliasDeepCommentsPlugin = TypeAliasDeepCommentsPlugin;