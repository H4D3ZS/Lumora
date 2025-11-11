"use strict";
/**
 * React Animation Parser
 * Parses React animations (CSS transitions, Animated API, Framer Motion) to Lumora Animation Schema
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactAnimationParser = void 0;
exports.getReactAnimationParser = getReactAnimationParser;
exports.resetReactAnimationParser = resetReactAnimationParser;
const parser = __importStar(require("@babel/parser"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
const error_handler_1 = require("../errors/error-handler");
/**
 * React Animation Parser
 * Converts React animation code to Lumora Animation Schema
 */
class ReactAnimationParser {
    constructor(config = {}) {
        this.animationCounter = 0;
        this.errorHandler = config.errorHandler || (0, error_handler_1.getErrorHandler)();
    }
    /**
     * Parse React component for animations
     */
    parseAnimations(source, filename) {
        const animations = [];
        try {
            const ast = this.parseAST(source);
            // Parse CSS transitions
            const cssAnimations = this.parseCSSTransitions(ast);
            animations.push(...cssAnimations);
            // Parse React Animated API
            const animatedAPIAnimations = this.parseAnimatedAPI(ast);
            animations.push(...animatedAPIAnimations);
            // Parse Framer Motion
            const framerMotionAnimations = this.parseFramerMotion(ast);
            animations.push(...framerMotionAnimations);
        }
        catch (error) {
            this.errorHandler.handleParseError({
                filePath: filename,
                errorMessage: `Failed to parse animations: ${error instanceof Error ? error.message : String(error)}`,
                sourceCode: source,
                framework: 'react',
            });
        }
        return animations;
    }
    /**
     * Parse source code to AST
     */
    parseAST(source) {
        return parser.parse(source, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript', 'decorators-legacy'],
        });
    }
    /**
     * Parse CSS transitions from style objects
     */
    parseCSSTransitions(ast) {
        const animations = [];
        (0, traverse_1.default)(ast, {
            ObjectProperty: (path) => {
                // Look for style objects with transition property
                if (t.isIdentifier(path.node.key, { name: 'style' }) && t.isObjectExpression(path.node.value)) {
                    const styleObj = path.node.value;
                    const transitionProp = styleObj.properties.find(prop => t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: 'transition' }));
                    if (transitionProp && t.isObjectProperty(transitionProp) && t.isExpression(transitionProp.value)) {
                        const transitions = this.parseCSSTransitionValue(transitionProp.value);
                        transitions.forEach(transition => {
                            const animation = this.convertCSSTransitionToSchema(transition);
                            animations.push(animation);
                        });
                    }
                }
            },
        });
        return animations;
    }
    /**
     * Parse CSS transition value
     */
    parseCSSTransitionValue(value) {
        const transitions = [];
        if (t.isStringLiteral(value)) {
            // Parse transition string: "opacity 300ms ease-in-out"
            const parts = value.value.split(/\s+/);
            if (parts.length >= 2) {
                transitions.push({
                    property: parts[0],
                    duration: this.parseDuration(parts[1]),
                    easing: parts[2] || 'ease',
                    delay: parts[3] ? this.parseDuration(parts[3]) : undefined,
                });
            }
        }
        else if (t.isTemplateLiteral(value)) {
            // Handle template literals
            const str = value.quasis[0]?.value.raw || '';
            const parts = str.split(/\s+/);
            if (parts.length >= 2) {
                transitions.push({
                    property: parts[0],
                    duration: this.parseDuration(parts[1]),
                    easing: parts[2] || 'ease',
                });
            }
        }
        return transitions;
    }
    /**
     * Parse duration string to milliseconds
     */
    parseDuration(duration) {
        if (duration.endsWith('ms')) {
            return parseInt(duration);
        }
        else if (duration.endsWith('s')) {
            return parseFloat(duration) * 1000;
        }
        return parseInt(duration) || 0;
    }
    /**
     * Convert CSS transition to animation schema
     */
    convertCSSTransitionToSchema(transition) {
        return {
            id: this.generateAnimationId(),
            type: 'timing',
            duration: transition.duration,
            delay: transition.delay,
            easing: this.mapCSSEasing(transition.easing),
            properties: [
                {
                    name: transition.property,
                    from: 0, // Would need context to determine actual values
                    to: 1,
                },
            ],
            metadata: {
                sourceFramework: 'react',
                sourceAPI: 'CSS Transition',
            },
        };
    }
    /**
     * Map CSS easing to Lumora easing type
     */
    mapCSSEasing(cssEasing) {
        const easingMap = {
            'linear': 'linear',
            'ease': 'ease',
            'ease-in': 'ease-in',
            'ease-out': 'ease-out',
            'ease-in-out': 'ease-in-out',
        };
        return easingMap[cssEasing] || 'ease';
    }
    /**
     * Parse React Animated API calls
     */
    parseAnimatedAPI(ast) {
        const animations = [];
        (0, traverse_1.default)(ast, {
            CallExpression: (path) => {
                const callee = path.node.callee;
                // Check for Animated.timing, Animated.spring, Animated.decay
                if (t.isMemberExpression(callee) && t.isIdentifier(callee.object, { name: 'Animated' })) {
                    const method = callee.property;
                    if (t.isIdentifier(method)) {
                        const animatedCall = this.parseAnimatedAPICall(path, method.name);
                        if (animatedCall) {
                            const animation = this.convertAnimatedAPIToSchema(animatedCall);
                            animations.push(animation);
                        }
                    }
                }
            },
        });
        return animations;
    }
    /**
     * Parse Animated API call
     */
    parseAnimatedAPICall(path, methodName) {
        const args = path.node.arguments;
        if (args.length < 2)
            return null;
        // First argument is the animated value
        const valueArg = args[0];
        let valueName = 'animatedValue';
        if (t.isIdentifier(valueArg)) {
            valueName = valueArg.name;
        }
        else if (t.isMemberExpression(valueArg) && t.isIdentifier(valueArg.property)) {
            valueName = valueArg.property.name;
        }
        // Second argument is the config object
        const configArg = args[1];
        const config = this.extractObjectProperties(configArg);
        // Check for .start() callback
        let callbacks = {};
        const parent = path.parent;
        if (t.isMemberExpression(parent) && t.isIdentifier(parent.property, { name: 'start' })) {
            const grandParent = path.parentPath?.parent;
            if (t.isCallExpression(grandParent) && grandParent.arguments.length > 0) {
                const callbackArg = grandParent.arguments[0];
                if (t.isArrowFunctionExpression(callbackArg) || t.isFunctionExpression(callbackArg)) {
                    callbacks.onComplete = 'animationComplete';
                }
            }
        }
        return {
            type: methodName,
            value: valueName,
            config,
            callbacks: Object.keys(callbacks).length > 0 ? callbacks : undefined,
        };
    }
    /**
     * Extract properties from object expression
     */
    extractObjectProperties(node) {
        const props = {};
        if (t.isObjectExpression(node)) {
            node.properties.forEach(prop => {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                    const key = prop.key.name;
                    const value = this.extractValue(prop.value);
                    props[key] = value;
                }
            });
        }
        return props;
    }
    /**
     * Extract value from expression
     */
    extractValue(node) {
        if (t.isNumericLiteral(node)) {
            return node.value;
        }
        else if (t.isStringLiteral(node)) {
            return node.value;
        }
        else if (t.isBooleanLiteral(node)) {
            return node.value;
        }
        else if (t.isObjectExpression(node)) {
            return this.extractObjectProperties(node);
        }
        else if (t.isIdentifier(node)) {
            return node.name;
        }
        return null;
    }
    /**
     * Convert Animated API call to animation schema
     */
    convertAnimatedAPIToSchema(animatedCall) {
        const schema = {
            id: this.generateAnimationId(),
            type: this.mapAnimatedAPIType(animatedCall.type),
            duration: animatedCall.config.duration || 300,
            easing: this.mapAnimatedEasing(animatedCall.config.easing),
            properties: [
                {
                    name: animatedCall.value,
                    from: animatedCall.config.toValue !== undefined ? 0 : animatedCall.config.fromValue || 0,
                    to: animatedCall.config.toValue || 1,
                },
            ],
            metadata: {
                sourceFramework: 'react',
                sourceAPI: `Animated.${animatedCall.type}`,
            },
        };
        // Add delay if present
        if (animatedCall.config.delay) {
            schema.delay = animatedCall.config.delay;
        }
        // Add spring config if spring animation
        if (animatedCall.type === 'spring') {
            schema.springConfig = {
                stiffness: animatedCall.config.stiffness || 100,
                damping: animatedCall.config.damping || 10,
                mass: animatedCall.config.mass || 1,
                velocity: animatedCall.config.velocity || 0,
            };
        }
        // Add decay config if decay animation
        if (animatedCall.type === 'decay') {
            schema.decayConfig = {
                velocity: animatedCall.config.velocity || 0,
                deceleration: animatedCall.config.deceleration || 0.998,
            };
        }
        // Add callbacks if present
        if (animatedCall.callbacks) {
            schema.callbacks = animatedCall.callbacks;
        }
        return schema;
    }
    /**
     * Map Animated API type to animation type
     */
    mapAnimatedAPIType(type) {
        const typeMap = {
            'timing': 'timing',
            'spring': 'spring',
            'decay': 'decay',
        };
        return typeMap[type] || 'timing';
    }
    /**
     * Map Animated easing to Lumora easing
     */
    mapAnimatedEasing(easing) {
        if (!easing)
            return 'ease';
        if (typeof easing === 'string') {
            return easing;
        }
        // Handle Easing functions
        if (typeof easing === 'object' && easing.name) {
            const easingMap = {
                'linear': 'linear',
                'ease': 'ease',
                'quad': 'ease-in-out',
                'cubic': 'ease-in-out',
                'elastic': 'elastic',
                'bounce': 'bounce',
            };
            return easingMap[easing.name] || 'ease';
        }
        return 'ease';
    }
    /**
     * Parse Framer Motion animations
     */
    parseFramerMotion(ast) {
        const animations = [];
        (0, traverse_1.default)(ast, {
            JSXOpeningElement: (path) => {
                const name = path.node.name;
                // Check if it's a motion component (motion.div, motion.button, etc.)
                if (t.isJSXMemberExpression(name) && t.isJSXIdentifier(name.object, { name: 'motion' })) {
                    const motionAnimation = this.parseFramerMotionProps(path.node.attributes);
                    if (motionAnimation) {
                        const animation = this.convertFramerMotionToSchema(motionAnimation);
                        animations.push(animation);
                    }
                }
            },
        });
        return animations;
    }
    /**
     * Parse Framer Motion props
     */
    parseFramerMotionProps(attributes) {
        const animation = {};
        attributes.forEach(attr => {
            if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
                const propName = attr.name.name;
                if (['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap'].includes(propName)) {
                    if (attr.value && t.isJSXExpressionContainer(attr.value)) {
                        const value = this.extractValue(attr.value.expression);
                        animation[propName] = value;
                    }
                }
            }
        });
        return Object.keys(animation).length > 0 ? animation : null;
    }
    /**
     * Convert Framer Motion to animation schema
     */
    convertFramerMotionToSchema(motion) {
        const properties = [];
        // Extract properties from initial and animate
        if (motion.initial && motion.animate) {
            Object.keys(motion.animate).forEach(key => {
                const from = motion.initial?.[key];
                const to = motion.animate?.[key];
                if (from !== undefined && to !== undefined) {
                    properties.push({
                        name: key,
                        from,
                        to,
                    });
                }
            });
        }
        // Extract transition config
        const transition = motion.transition || {};
        const duration = (transition.duration || 0.3) * 1000; // Convert to ms
        const delay = transition.delay ? transition.delay * 1000 : undefined;
        const easing = this.mapFramerMotionEasing(transition.ease);
        const schema = {
            id: this.generateAnimationId(),
            type: transition.type === 'spring' ? 'spring' : 'timing',
            duration,
            delay,
            easing,
            properties,
            metadata: {
                sourceFramework: 'react',
                sourceAPI: 'Framer Motion',
            },
        };
        // Add spring config if spring animation
        if (transition.type === 'spring') {
            schema.springConfig = {
                stiffness: transition.stiffness || 100,
                damping: transition.damping || 10,
                mass: transition.mass || 1,
            };
        }
        // Add iterations if repeat is specified
        if (transition.repeat !== undefined) {
            schema.iterations = transition.repeat === Infinity ? -1 : transition.repeat;
        }
        return schema;
    }
    /**
     * Map Framer Motion easing to Lumora easing
     */
    mapFramerMotionEasing(ease) {
        if (!ease)
            return 'ease';
        if (typeof ease === 'string') {
            const easingMap = {
                'linear': 'linear',
                'easeIn': 'ease-in',
                'easeOut': 'ease-out',
                'easeInOut': 'ease-in-out',
                'circIn': 'ease-in',
                'circOut': 'ease-out',
                'circInOut': 'ease-in-out',
                'backIn': 'ease-in',
                'backOut': 'ease-out',
                'backInOut': 'ease-in-out',
            };
            return easingMap[ease] || 'ease';
        }
        if (Array.isArray(ease) && ease.length === 4) {
            // Cubic bezier
            return 'cubic-bezier';
        }
        return 'ease';
    }
    /**
     * Generate unique animation ID
     */
    generateAnimationId() {
        return `react-animation-${++this.animationCounter}`;
    }
}
exports.ReactAnimationParser = ReactAnimationParser;
/**
 * Singleton instance
 */
let reactAnimationParserInstance = null;
/**
 * Get React animation parser instance
 */
function getReactAnimationParser(config) {
    if (!reactAnimationParserInstance) {
        reactAnimationParserInstance = new ReactAnimationParser(config);
    }
    return reactAnimationParserInstance;
}
/**
 * Reset React animation parser instance
 */
function resetReactAnimationParser() {
    reactAnimationParserInstance = null;
}
