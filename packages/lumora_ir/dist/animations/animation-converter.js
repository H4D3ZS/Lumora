"use strict";
/**
 * Animation & Gesture Converter
 * Handles conversion between React animations (Framer Motion, React Spring) and Flutter animations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimationConverter = void 0;
exports.getAnimationConverter = getAnimationConverter;
/**
 * Animation Converter
 * Converts between React (Framer Motion, React Spring) and Flutter animations
 */
class AnimationConverter {
    /**
     * Convert Framer Motion to Flutter AnimatedContainer/AnimationController
     */
    convertFramerMotionToFlutter(animation) {
        const result = {
            imports: ["import 'package:flutter/material.dart';"],
            controllerDeclarations: [],
            animationDefinitions: [],
            widgetWrappers: [],
            disposeCode: [],
        };
        if (animation.type === 'spring' || animation.type === 'tween') {
            // Use AnimationController for complex animations
            const controllerName = 'animationController';
            // Controller declaration
            result.controllerDeclarations.push(`late AnimationController ${controllerName};`);
            // Animation initialization (in initState)
            let initCode = `${controllerName} = AnimationController(\n`;
            initCode += `  vsync: this,\n`;
            initCode += `  duration: Duration(milliseconds: ${animation.duration || 300}),\n`;
            initCode += `);\n`;
            if (animation.delay) {
                initCode += `Future.delayed(Duration(milliseconds: ${animation.delay}), () {\n`;
                initCode += `  ${controllerName}.forward();\n`;
                initCode += `});\n`;
            }
            else {
                initCode += `${controllerName}.forward();\n`;
            }
            if (animation.repeat) {
                if (animation.repeat === 'infinite') {
                    initCode += `${controllerName}.repeat();\n`;
                }
                else {
                    initCode += `${controllerName}.repeat(max: ${animation.repeat});\n`;
                }
            }
            result.animationDefinitions.push(initCode);
            // Generate animations for each property
            for (const prop of animation.properties) {
                const animationName = `${prop.name}Animation`;
                let animDef = `late Animation<${this.getAnimationType(prop.name)}> ${animationName};\n`;
                animDef += `${animationName} = `;
                if (animation.type === 'spring') {
                    animDef += `CurvedAnimation(\n`;
                    animDef += `  parent: ${controllerName},\n`;
                    animDef += `  curve: Curves.elasticOut,\n`;
                    animDef += `);\n`;
                }
                else {
                    animDef += `Tween<${this.getAnimationType(prop.name)}>(\n`;
                    animDef += `  begin: ${this.convertValue(prop.from, prop.name)},\n`;
                    animDef += `  end: ${this.convertValue(prop.to, prop.name)},\n`;
                    animDef += `).animate(CurvedAnimation(\n`;
                    animDef += `  parent: ${controllerName},\n`;
                    animDef += `  curve: ${this.convertEasing(animation.easing)},\n`;
                    animDef += `));\n`;
                }
                result.animationDefinitions.push(animDef);
            }
            // Widget wrapper
            let wrapper = `AnimatedBuilder(\n`;
            wrapper += `  animation: ${controllerName},\n`;
            wrapper += `  builder: (context, child) {\n`;
            wrapper += `    return Transform(\n`;
            wrapper += `      transform: Matrix4.identity()\n`;
            for (const prop of animation.properties) {
                const animationName = `${prop.name}Animation`;
                if (prop.name === 'x' || prop.name === 'translateX') {
                    wrapper += `        ..translate(${animationName}.value, 0.0)\n`;
                }
                else if (prop.name === 'y' || prop.name === 'translateY') {
                    wrapper += `        ..translate(0.0, ${animationName}.value)\n`;
                }
                else if (prop.name === 'scale') {
                    wrapper += `        ..scale(${animationName}.value)\n`;
                }
                else if (prop.name === 'rotate') {
                    wrapper += `        ..rotateZ(${animationName}.value)\n`;
                }
            }
            wrapper += `      ,\n`;
            wrapper += `      child: /* your widget */,\n`;
            wrapper += `    );\n`;
            wrapper += `  },\n`;
            wrapper += `)`;
            result.widgetWrappers.push(wrapper);
            // Dispose code
            result.disposeCode?.push(`${controllerName}.dispose();`);
        }
        else if (animation.type === 'keyframes') {
            // Use TweenSequence for keyframes
            const controllerName = 'keyframeController';
            result.controllerDeclarations.push(`late AnimationController ${controllerName};`);
            // For each animated property, create a TweenSequence
            for (const prop of animation.properties) {
                if (prop.keyframes) {
                    const animationName = `${prop.name}Animation`;
                    let animDef = `late Animation<${this.getAnimationType(prop.name)}> ${animationName};\n`;
                    animDef += `${animationName} = TweenSequence<${this.getAnimationType(prop.name)}>(\n`;
                    animDef += `  [\n`;
                    for (let i = 0; i < prop.keyframes.length - 1; i++) {
                        const from = prop.keyframes[i];
                        const to = prop.keyframes[i + 1];
                        const weight = 1.0 / (prop.keyframes.length - 1);
                        animDef += `    TweenSequenceItem(\n`;
                        animDef += `      tween: Tween<${this.getAnimationType(prop.name)}>(\n`;
                        animDef += `        begin: ${this.convertValue(from, prop.name)},\n`;
                        animDef += `        end: ${this.convertValue(to, prop.name)},\n`;
                        animDef += `      ),\n`;
                        animDef += `      weight: ${weight},\n`;
                        animDef += `    ),\n`;
                    }
                    animDef += `  ],\n`;
                    animDef += `).animate(${controllerName});\n`;
                    result.animationDefinitions.push(animDef);
                }
            }
        }
        return result;
    }
    /**
     * Convert React Spring to Flutter ImplicitlyAnimatedWidget
     */
    convertReactSpringToFlutter(animation) {
        const result = {
            imports: ["import 'package:flutter/material.dart';"],
            controllerDeclarations: [],
            animationDefinitions: [],
            widgetWrappers: [],
        };
        // Use AnimatedContainer for simple property animations
        let wrapper = `AnimatedContainer(\n`;
        wrapper += `  duration: Duration(milliseconds: ${animation.duration || 300}),\n`;
        wrapper += `  curve: ${this.convertEasing(animation.easing)},\n`;
        for (const prop of animation.properties) {
            const flutterProp = this.convertPropertyName(prop.name);
            const value = this.convertValue(prop.to, prop.name);
            if (flutterProp) {
                wrapper += `  ${flutterProp}: ${value},\n`;
            }
        }
        wrapper += `  child: /* your widget */,\n`;
        wrapper += `)`;
        result.widgetWrappers.push(wrapper);
        return result;
    }
    /**
     * Convert Flutter animations to Framer Motion
     */
    convertFlutterToFramerMotion(flutterAnimation) {
        // Parse Flutter animation and convert to Framer Motion syntax
        let motionCode = `<motion.div\n`;
        motionCode += `  initial={{ opacity: 0, scale: 0.8 }}\n`;
        motionCode += `  animate={{ opacity: 1, scale: 1 }}\n`;
        motionCode += `  transition={{ duration: 0.3, ease: "easeOut" }}\n`;
        motionCode += `>\n`;
        motionCode += `  {/* your content */}\n`;
        motionCode += `</motion.div>`;
        return motionCode;
    }
    /**
     * Convert gesture handlers
     */
    convertGestureToFlutter(gesture) {
        const result = {
            imports: ["import 'package:flutter/material.dart';"],
            controllerDeclarations: [],
            animationDefinitions: [],
            widgetWrappers: [],
        };
        switch (gesture.type) {
            case 'drag':
                const wrapper = this.generateDraggableWidget(gesture);
                result.widgetWrappers.push(wrapper);
                break;
            case 'tap':
            case 'longPress':
                const gestureWrapper = this.generateGestureDetector(gesture);
                result.widgetWrappers.push(gestureWrapper);
                break;
            case 'pinch':
            case 'rotate':
                result.imports.push("import 'package:flutter/gestures.dart';");
                const complexGesture = this.generateComplexGesture(gesture);
                result.widgetWrappers.push(complexGesture);
                break;
        }
        return result;
    }
    // Helper methods
    generateDraggableWidget(gesture) {
        let code = `Draggable(\n`;
        code += `  child: /* your widget */,\n`;
        code += `  feedback: /* dragging widget */,\n`;
        code += `  onDragEnd: (details) {\n`;
        code += `    ${gesture.handler}\n`;
        code += `  },\n`;
        if (gesture.constraints?.axis) {
            code += `  axis: Axis.${gesture.constraints.axis === 'x' ? 'horizontal' : 'vertical'},\n`;
        }
        code += `)`;
        return code;
    }
    generateGestureDetector(gesture) {
        let code = `GestureDetector(\n`;
        if (gesture.type === 'tap') {
            code += `  onTap: () {\n`;
            code += `    ${gesture.handler}\n`;
            code += `  },\n`;
        }
        else if (gesture.type === 'longPress') {
            code += `  onLongPress: () {\n`;
            code += `    ${gesture.handler}\n`;
            code += `  },\n`;
        }
        code += `  child: /* your widget */,\n`;
        code += `)`;
        return code;
    }
    generateComplexGesture(gesture) {
        let code = `GestureDetector(\n`;
        if (gesture.type === 'pinch') {
            code += `  onScaleStart: (details) {},\n`;
            code += `  onScaleUpdate: (details) {\n`;
            code += `    ${gesture.handler}\n`;
            code += `  },\n`;
            code += `  onScaleEnd: (details) {},\n`;
        }
        else if (gesture.type === 'rotate') {
            code += `  onScaleUpdate: (details) {\n`;
            code += `    // rotation = details.rotation\n`;
            code += `    ${gesture.handler}\n`;
            code += `  },\n`;
        }
        code += `  child: /* your widget */,\n`;
        code += `)`;
        return code;
    }
    getAnimationType(propertyName) {
        if (propertyName === 'opacity')
            return 'double';
        if (propertyName === 'color')
            return 'Color';
        if (propertyName.includes('scale'))
            return 'double';
        if (propertyName.includes('rotate'))
            return 'double';
        if (propertyName === 'x' || propertyName === 'y')
            return 'double';
        if (propertyName.includes('translate'))
            return 'double';
        return 'double';
    }
    convertValue(value, propertyName) {
        if (propertyName === 'color') {
            return `Color(0xFF${value.replace('#', '')})`;
        }
        if (propertyName === 'opacity') {
            return value.toString();
        }
        if (propertyName.includes('rotate')) {
            // Convert degrees to radians if needed
            return `${value} * pi / 180`;
        }
        return value.toString();
    }
    convertEasing(easing) {
        const easingMap = {
            'linear': 'Curves.linear',
            'easeIn': 'Curves.easeIn',
            'easeOut': 'Curves.easeOut',
            'easeInOut': 'Curves.easeInOut',
            'ease': 'Curves.ease',
            'circIn': 'Curves.easeInCirc',
            'circOut': 'Curves.easeOutCirc',
            'backIn': 'Curves.easeInBack',
            'backOut': 'Curves.easeOutBack',
            'anticipate': 'Curves.easeInOutBack',
        };
        return easingMap[easing || 'easeOut'] || 'Curves.easeOut';
    }
    convertPropertyName(reactProp) {
        const propMap = {
            'opacity': 'color', // AnimatedOpacity uses opacity
            'backgroundColor': 'color',
            'width': 'width',
            'height': 'height',
            'padding': 'padding',
            'margin': 'margin',
        };
        return propMap[reactProp] || null;
    }
    /**
     * Generate imports for animation dependencies
     */
    getAnimationDependencies(type) {
        if (type === 'framer') {
            return ['framer-motion'];
        }
        else if (type === 'spring') {
            return ['react-spring', '@react-spring/web'];
        }
        else if (type === 'flutter') {
            return []; // Built into Flutter SDK
        }
        return [];
    }
}
exports.AnimationConverter = AnimationConverter;
// Singleton instance
let animationConverterInstance = null;
function getAnimationConverter() {
    if (!animationConverterInstance) {
        animationConverterInstance = new AnimationConverter();
    }
    return animationConverterInstance;
}
