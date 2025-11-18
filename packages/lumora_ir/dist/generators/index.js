"use strict";
/**
 * Code Generators
 * Generate source code from Lumora IR
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFlutterCode = exports.createFlutterGenerator = exports.FlutterGenerator = exports.generateReactCode = exports.createReactGenerator = exports.ReactGenerator = void 0;
var react_generator_1 = require("./react-generator");
Object.defineProperty(exports, "ReactGenerator", { enumerable: true, get: function () { return react_generator_1.ReactGenerator; } });
Object.defineProperty(exports, "createReactGenerator", { enumerable: true, get: function () { return react_generator_1.createReactGenerator; } });
Object.defineProperty(exports, "generateReactCode", { enumerable: true, get: function () { return react_generator_1.generateReactCode; } });
var flutter_generator_1 = require("./flutter-generator");
Object.defineProperty(exports, "FlutterGenerator", { enumerable: true, get: function () { return flutter_generator_1.FlutterGenerator; } });
Object.defineProperty(exports, "createFlutterGenerator", { enumerable: true, get: function () { return flutter_generator_1.createFlutterGenerator; } });
Object.defineProperty(exports, "generateFlutterCode", { enumerable: true, get: function () { return flutter_generator_1.generateFlutterCode; } });
