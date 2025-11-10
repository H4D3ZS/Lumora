"use strict";
/**
 * Parsers Module
 * AST parsers for converting source code to Lumora IR
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DartParser = exports.resetReactParser = exports.getReactParser = exports.ReactParser = void 0;
var react_parser_1 = require("./react-parser");
Object.defineProperty(exports, "ReactParser", { enumerable: true, get: function () { return react_parser_1.ReactParser; } });
Object.defineProperty(exports, "getReactParser", { enumerable: true, get: function () { return react_parser_1.getReactParser; } });
Object.defineProperty(exports, "resetReactParser", { enumerable: true, get: function () { return react_parser_1.resetReactParser; } });
var dart_parser_1 = require("./dart-parser");
Object.defineProperty(exports, "DartParser", { enumerable: true, get: function () { return dart_parser_1.DartParser; } });
