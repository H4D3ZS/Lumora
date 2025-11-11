"use strict";
/**
 * Lumora Animation Schema Type Definitions
 * Framework-agnostic intermediate representation for animations
 *
 * This schema supports conversion between:
 * - React: CSS transitions, React Animated API, Framer Motion
 * - Flutter: AnimationController, Tween, ImplicitAnimations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANIMATION_PRESETS = void 0;
/**
 * Common animation presets
 */
exports.ANIMATION_PRESETS = {
    fadeIn: {
        name: 'Fade In',
        description: 'Fade element in from transparent to opaque',
        animation: {
            type: 'timing',
            duration: 300,
            easing: 'ease-in',
            properties: [
                { name: 'opacity', from: 0, to: 1 }
            ]
        }
    },
    fadeOut: {
        name: 'Fade Out',
        description: 'Fade element out from opaque to transparent',
        animation: {
            type: 'timing',
            duration: 300,
            easing: 'ease-out',
            properties: [
                { name: 'opacity', from: 1, to: 0 }
            ]
        }
    },
    slideInLeft: {
        name: 'Slide In Left',
        description: 'Slide element in from the left',
        animation: {
            type: 'timing',
            duration: 400,
            easing: 'ease-out',
            properties: [
                { name: 'translateX', from: -100, to: 0, unit: '%' },
                { name: 'opacity', from: 0, to: 1 }
            ]
        }
    },
    slideInRight: {
        name: 'Slide In Right',
        description: 'Slide element in from the right',
        animation: {
            type: 'timing',
            duration: 400,
            easing: 'ease-out',
            properties: [
                { name: 'translateX', from: 100, to: 0, unit: '%' },
                { name: 'opacity', from: 0, to: 1 }
            ]
        }
    },
    scaleIn: {
        name: 'Scale In',
        description: 'Scale element from small to normal size',
        animation: {
            type: 'spring',
            duration: 500,
            easing: 'spring',
            springConfig: {
                stiffness: 200,
                damping: 15
            },
            properties: [
                { name: 'scale', from: 0, to: 1 }
            ]
        }
    },
    bounce: {
        name: 'Bounce',
        description: 'Bounce animation',
        animation: {
            type: 'timing',
            duration: 600,
            easing: 'bounce',
            properties: [
                { name: 'translateY', from: 0, to: 0, keyframes: [
                        { offset: 0, value: 0 },
                        { offset: 0.25, value: -30, easing: 'ease-out' },
                        { offset: 0.5, value: 0, easing: 'ease-in' },
                        { offset: 0.75, value: -15, easing: 'ease-out' },
                        { offset: 1, value: 0, easing: 'ease-in' }
                    ] }
            ]
        }
    }
};
