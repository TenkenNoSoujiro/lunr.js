"use strict";

const { ExampleTagPlugin } = require("./exampleTag");
const { ThrowsTagPlugin } = require("./throwsTag");
const { TypeAliasDeepCommentsPlugin } = require("./typeAliasDeepComments");
const { HideDefaultValuesPlugin } = require("./hideDefaultValues");

module.exports = (pluginHost) => {
    const app = pluginHost.owner;
    app.converter.addComponent("example-tag", ExampleTagPlugin);
    app.converter.addComponent("throws-tag", ThrowsTagPlugin);
    app.converter.addComponent("type-alias-deep-comments", TypeAliasDeepCommentsPlugin);
    app.converter.addComponent("hide-default-values", HideDefaultValuesPlugin);
};