"use strict";
/**
 * Parsers Module
 * AST parsers for converting source code to Lumora IR
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlatformGenerator = exports.PlatformCodeGenerator = exports.DartPlatformGenerator = exports.ReactPlatformGenerator = exports.DartPlatformParser = exports.ReactPlatformParser = exports.parseFlutterNetwork = exports.FlutterNetworkParser = exports.parseReactNetwork = exports.ReactNetworkParser = exports.resetFlutterAnimationParser = exports.getFlutterAnimationParser = exports.FlutterAnimationParser = exports.resetReactAnimationParser = exports.getReactAnimationParser = exports.ReactAnimationParser = exports.DartParser = exports.resetReactParser = exports.getReactParser = exports.ReactParser = void 0;
var react_parser_1 = require("./react-parser");
Object.defineProperty(exports, "ReactParser", { enumerable: true, get: function () { return react_parser_1.ReactParser; } });
Object.defineProperty(exports, "getReactParser", { enumerable: true, get: function () { return react_parser_1.getReactParser; } });
Object.defineProperty(exports, "resetReactParser", { enumerable: true, get: function () { return react_parser_1.resetReactParser; } });
var dart_parser_1 = require("./dart-parser");
Object.defineProperty(exports, "DartParser", { enumerable: true, get: function () { return dart_parser_1.DartParser; } });
var react_animation_parser_1 = require("./react-animation-parser");
Object.defineProperty(exports, "ReactAnimationParser", { enumerable: true, get: function () { return react_animation_parser_1.ReactAnimationParser; } });
Object.defineProperty(exports, "getReactAnimationParser", { enumerable: true, get: function () { return react_animation_parser_1.getReactAnimationParser; } });
Object.defineProperty(exports, "resetReactAnimationParser", { enumerable: true, get: function () { return react_animation_parser_1.resetReactAnimationParser; } });
var flutter_animation_parser_1 = require("./flutter-animation-parser");
Object.defineProperty(exports, "FlutterAnimationParser", { enumerable: true, get: function () { return flutter_animation_parser_1.FlutterAnimationParser; } });
Object.defineProperty(exports, "getFlutterAnimationParser", { enumerable: true, get: function () { return flutter_animation_parser_1.getFlutterAnimationParser; } });
Object.defineProperty(exports, "resetFlutterAnimationParser", { enumerable: true, get: function () { return flutter_animation_parser_1.resetFlutterAnimationParser; } });
var react_network_parser_1 = require("./react-network-parser");
Object.defineProperty(exports, "ReactNetworkParser", { enumerable: true, get: function () { return react_network_parser_1.ReactNetworkParser; } });
Object.defineProperty(exports, "parseReactNetwork", { enumerable: true, get: function () { return react_network_parser_1.parseReactNetwork; } });
var flutter_network_parser_1 = require("./flutter-network-parser");
Object.defineProperty(exports, "FlutterNetworkParser", { enumerable: true, get: function () { return flutter_network_parser_1.FlutterNetworkParser; } });
Object.defineProperty(exports, "parseFlutterNetwork", { enumerable: true, get: function () { return flutter_network_parser_1.parseFlutterNetwork; } });
var platform_parser_1 = require("./platform-parser");
Object.defineProperty(exports, "ReactPlatformParser", { enumerable: true, get: function () { return platform_parser_1.ReactPlatformParser; } });
Object.defineProperty(exports, "DartPlatformParser", { enumerable: true, get: function () { return platform_parser_1.DartPlatformParser; } });
var platform_generator_1 = require("./platform-generator");
Object.defineProperty(exports, "ReactPlatformGenerator", { enumerable: true, get: function () { return platform_generator_1.ReactPlatformGenerator; } });
Object.defineProperty(exports, "DartPlatformGenerator", { enumerable: true, get: function () { return platform_generator_1.DartPlatformGenerator; } });
Object.defineProperty(exports, "PlatformCodeGenerator", { enumerable: true, get: function () { return platform_generator_1.PlatformCodeGenerator; } });
Object.defineProperty(exports, "createPlatformGenerator", { enumerable: true, get: function () { return platform_generator_1.createPlatformGenerator; } });
