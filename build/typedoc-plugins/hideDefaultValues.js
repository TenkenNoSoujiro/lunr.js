"use strict";

const { ConverterComponent, Component } = require("typedoc/dist/lib/converter/components");
const { ReflectionKind } = require("typedoc/dist/lib/models/reflections");
const { Converter } = require("typedoc/dist/lib/converter/converter");

class HideDefaultValuesPlugin extends ConverterComponent {
    constructor() {
        super(...arguments);
    }
    initialize() {
        this.queue = [];
        this.listenTo(this.owner, {
            [Converter.EVENT_CREATE_DECLARATION]: this.onDeclaration,
            [Converter.EVENT_CREATE_SIGNATURE]: this.onDeclaration,
            [Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
        });
    }
    onDeclaration(context, reflection, node) {
        if (reflection.kindOf(ReflectionKind.VariableOrProperty) && node && node.type && node.initializer) {
            this.queue.push(reflection);
        }
    }
    onBeginResolve(context) {
        for (const reflection of this.queue) {
            if (reflection.type && reflection.defaultValue && /[\r\n]/.test(reflection.defaultValue)) {
                reflection.defaultValue = undefined;
            }
        }
    }
}
Component({ name: "hide-default-values" })(HideDefaultValuesPlugin);
exports.HideDefaultValuesPlugin = HideDefaultValuesPlugin;