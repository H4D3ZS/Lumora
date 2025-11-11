/**
 * Lumora IR Type Definitions
 * Framework-agnostic intermediate representation for UI components
 */
import type { NavigationSchema } from '../navigation/navigation-types';
import type { AnimationSchema, AnimationGroup, AnimationTransition } from './animation-types';
import type { NetworkSchema } from './network-types';
import type { PlatformSchema } from './platform-types';
export interface LumoraIR {
    version: string;
    metadata: IRMetadata;
    nodes: LumoraNode[];
    theme?: ThemeDefinition;
    /** @deprecated Use navigationSchema instead */
    navigation?: NavigationDefinition;
    /** Complete navigation configuration */
    navigationSchema?: NavigationSchema;
    /** Animation definitions */
    animations?: AnimationSchema[];
    /** Animation groups for coordinated animations */
    animationGroups?: AnimationGroup[];
    /** Page/screen transition animations */
    transitions?: Record<string, AnimationTransition>;
    /** Network configuration */
    network?: NetworkSchema;
    /** Platform-specific code configuration */
    platform?: PlatformSchema;
}
export interface IRMetadata {
    sourceFramework: 'react' | 'flutter';
    sourceFile: string;
    generatedAt: number;
    author?: string;
    irVersion?: string;
    customWidgets?: CustomWidgetMetadata[];
}
export interface CustomWidgetMetadata {
    name: string;
    type: 'StatelessWidget' | 'StatefulWidget' | 'Component';
    properties: CustomWidgetProperty[];
}
export interface CustomWidgetProperty {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
}
export interface LumoraNode {
    id: string;
    type: string;
    props: Record<string, any>;
    children: LumoraNode[];
    state?: StateDefinition;
    events?: EventDefinition[];
    lifecycle?: LifecycleDefinition[];
    /** Animation IDs applied to this node */
    animations?: string[];
    metadata: NodeMetadata;
}
export interface NodeMetadata {
    lineNumber: number;
    documentation?: string;
}
export interface StateDefinition {
    type: 'local' | 'global' | 'async';
    variables: StateVariable[];
}
export interface StateVariable {
    name: string;
    type: string;
    initialValue: any;
    mutable: boolean;
}
export interface EventDefinition {
    name: string;
    handler: string;
    parameters: Parameter[];
}
export interface Parameter {
    name: string;
    type: string;
    optional?: boolean;
}
export interface LifecycleDefinition {
    type: 'mount' | 'unmount' | 'update' | 'effect';
    handler: string;
    dependencies?: string[];
}
export interface ThemeDefinition {
    colors?: Record<string, any>;
    typography?: Record<string, any>;
    spacing?: Record<string, any>;
}
/**
 * @deprecated Use NavigationSchema from '../navigation/navigation-types' instead
 * This is kept for backward compatibility
 */
export interface NavigationDefinition {
    routes?: Route[];
}
/**
 * @deprecated Use Route from '../navigation/navigation-types' instead
 * This is kept for backward compatibility
 */
export interface Route {
    path: string;
    component: string;
    params?: Record<string, any>;
}
/**
 * IR Storage Entry with versioning
 */
export interface IRStorageEntry {
    id: string;
    ir: LumoraIR;
    version: number;
    timestamp: number;
    checksum: string;
}
/**
 * IR Migration definition
 */
export interface IRMigration {
    fromVersion: string;
    toVersion: string;
    migrate: (ir: any) => LumoraIR;
}
/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors?: ValidationError[];
}
export interface ValidationError {
    path: string;
    message: string;
    keyword?: string;
}
