"use strict";
/**
 * Converters
 * Bidirectional conversion between React and Flutter
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFlutterToReact = exports.convertReactToFlutter = exports.createBidirectionalConverter = exports.BidirectionalConverter = void 0;
var bidirectional_converter_1 = require("./bidirectional-converter");
Object.defineProperty(exports, "BidirectionalConverter", { enumerable: true, get: function () { return bidirectional_converter_1.BidirectionalConverter; } });
Object.defineProperty(exports, "createBidirectionalConverter", { enumerable: true, get: function () { return bidirectional_converter_1.createBidirectionalConverter; } });
Object.defineProperty(exports, "convertReactToFlutter", { enumerable: true, get: function () { return bidirectional_converter_1.convertReactToFlutter; } });
Object.defineProperty(exports, "convertFlutterToReact", { enumerable: true, get: function () { return bidirectional_converter_1.convertFlutterToReact; } });
