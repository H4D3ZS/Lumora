/**
 * Plugin System Usage Examples
 * 
 * This file demonstrates how to use the Lumora plugin and package management system.
 */

import {
  getPluginRegistry,
  getPackageManager,
  Plugin,
  PluginWidget,
  PackageInfo,
} from '../src';

// ============================================================================
// Example 1: Register a Custom Plugin
// ============================================================================

function registerCustomPlugin() {
  const registry = getPluginRegistry();

  const customPlugin: Plugin = {
    metadata: {
      name: 'lumora-ui-kit',
      version: '1.0.0',
      description: 'Custom UI components for Lumora',
      author: 'Your Name',
      homepage: 'https://github.com/yourname/lumora-ui-kit',
      license: 'MIT',
    },
    compatibility: {
      lumora: '^0.1.0',
      react: '^18.0.0',
      flutter: '^3.0.0',
      platforms: ['ios', 'android', 'web'],
    },
    capabilities: {
      widgets: [
        {
          name: 'CustomButton',
          type: 'component',
          framework: 'both',
          import: "import { CustomButton } from 'lumora-ui-kit';",
          props: {
            variant: 'primary' | 'secondary' | 'outline',
            size: 'small' | 'medium' | 'large',
            disabled: 'boolean',
          },
        },
        {
          name: 'CustomCard',
          type: 'component',
          framework: 'both',
          import: "import { CustomCard } from 'lumora-ui-kit';",
          props: {
            elevation: 'number',
            padding: 'number',
          },
        },
      ],
      stateManagement: false,
      navigation: false,
      networking: false,
      storage: false,
      nativeCode: false,
    },
    enabled: true,
  };

  const result = registry.register(customPlugin);

  if (result.valid) {
    console.log('✓ Plugin registered successfully');
    
    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      result.warnings.forEach(w => console.log(`   ${w}`));
    }
  } else {
    console.error('✗ Plugin registration failed:');
    result.errors.forEach(e => console.error(`   ${e}`));
  }

  return result.valid;
}

// ============================================================================
// Example 2: Check Package Compatibility
// ============================================================================

function checkPackageCompatibility() {
  const manager = getPackageManager();

  // Check Flutter package
  const providerInfo = manager.checkPackageCompatibility(
    'provider',
    '6.0.0',
    'flutter'
  );

  console.log('\nFlutter Package: provider');
  console.log('  Compatible:', providerInfo.isLumoraCompatible ? '✓' : '?');
  console.log('  Native code:', providerInfo.hasNativeDependencies ? '⚠️' : '✓');
  
  if (providerInfo.warnings.length > 0) {
    console.log('  Warnings:');
    providerInfo.warnings.forEach(w => console.log(`    ${w}`));
  }

  // Check React package
  const axiosInfo = manager.checkPackageCompatibility(
    'axios',
    '1.0.0',
    'react'
  );

  console.log('\nReact Package: axios');
  console.log('  Compatible:', axiosInfo.isLumoraCompatible ? '✓' : '?');
  console.log('  Native code:', axiosInfo.hasNativeDependencies ? '⚠️' : '✓');

  // Check native package
  const cameraInfo = manager.checkPackageCompatibility(
    'camera',
    '0.10.0',
    'flutter'
  );

  console.log('\nFlutter Package: camera (native)');
  console.log('  Compatible:', cameraInfo.isLumoraCompatible ? '✓' : '?');
  console.log('  Native code:', cameraInfo.hasNativeDependencies ? '⚠️' : '✓');
  
  if (cameraInfo.warnings.length > 0) {
    console.log('  Warnings:');
    cameraInfo.warnings.forEach(w => console.log(`    ${w}`));
  }
}

// ============================================================================
// Example 3: Resolve Plugin Dependencies
// ============================================================================

function resolveDependencies() {
  const registry = getPluginRegistry();

  // Register base plugin
  const basePlugin: Plugin = {
    metadata: { name: 'lumora-base', version: '1.0.0' },
    compatibility: { lumora: '^0.1.0' },
    enabled: true,
  };

  // Register plugin with dependency
  const extendedPlugin: Plugin = {
    metadata: { name: 'lumora-extended', version: '1.0.0' },
    compatibility: { lumora: '^0.1.0' },
    dependencies: [
      { name: 'lumora-base', version: '1.0.0' },
    ],
    enabled: true,
  };

  registry.register(basePlugin);
  registry.register(extendedPlugin);

  // Resolve installation order
  const installOrder = registry.resolveDependencies('lumora-extended');
  
  console.log('\nInstallation order:');
  installOrder.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });

  // Check for conflicts
  const conflicts = registry.checkDependencyConflicts([
    'lumora-base',
    'lumora-extended',
  ]);

  if (conflicts.length > 0) {
    console.log('\n⚠️  Dependency conflicts:');
    conflicts.forEach(c => console.log(`   ${c}`));
  } else {
    console.log('\n✓ No dependency conflicts');
  }
}

// ============================================================================
// Example 4: Get Plugin Widgets
// ============================================================================

function getPluginWidgets() {
  const registry = getPluginRegistry();

  // Get widgets from specific plugin
  const widgets = registry.getPluginWidgets('lumora-ui-kit');
  
  console.log('\nWidgets from lumora-ui-kit:');
  widgets.forEach(widget => {
    console.log(`  • ${widget.name} (${widget.framework})`);
  });

  // Get all widgets from enabled plugins
  const allWidgets = registry.getAllPluginWidgets();
  
  console.log(`\nTotal widgets available: ${allWidgets.length}`);
}

// ============================================================================
// Example 5: Analyze Project Dependencies
// ============================================================================

function analyzeProject(projectPath: string) {
  const manager = getPackageManager();

  console.log(`\nAnalyzing project: ${projectPath}`);

  const analysis = manager.analyzeProject(projectPath);

  // Display Flutter packages
  if (analysis.flutter.length > 0) {
    console.log(`\nFlutter packages (${analysis.flutter.length}):`);
    analysis.flutter.forEach(pkg => {
      const icon = pkg.isLumoraCompatible ? '✓' : 
                   pkg.hasNativeDependencies ? '⚠️' : '?';
      console.log(`  ${icon} ${pkg.name} (${pkg.version})`);
    });
  }

  // Display React packages
  if (analysis.react.length > 0) {
    console.log(`\nReact packages (${analysis.react.length}):`);
    analysis.react.forEach(pkg => {
      const icon = pkg.isLumoraCompatible ? '✓' : 
                   pkg.hasNativeDependencies ? '⚠️' : '?';
      console.log(`  ${icon} ${pkg.name} (${pkg.version})`);
    });
  }

  // Display warnings
  if (analysis.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    analysis.warnings.forEach(w => console.log(`   ${w}`));
  }

  // Summary
  const totalPackages = analysis.flutter.length + analysis.react.length;
  const nativePackages = [...analysis.flutter, ...analysis.react]
    .filter(p => p.hasNativeDependencies).length;
  const compatiblePackages = [...analysis.flutter, ...analysis.react]
    .filter(p => p.isLumoraCompatible).length;

  console.log('\nSummary:');
  console.log(`  Total packages: ${totalPackages}`);
  console.log(`  Lumora-compatible: ${compatiblePackages}`);
  console.log(`  With native code: ${nativePackages}`);
}

// ============================================================================
// Example 6: Convert Package to Plugin
// ============================================================================

function convertPackageToPlugin() {
  const manager = getPackageManager();

  const packageInfo = manager.checkPackageCompatibility(
    'provider',
    '6.0.0',
    'flutter'
  );

  const plugin = manager.packageToPlugin(packageInfo);

  console.log('\nConverted package to plugin:');
  console.log('  Name:', plugin.metadata.name);
  console.log('  Version:', plugin.metadata.version);
  console.log('  Enabled:', plugin.enabled);
  console.log('  Native code:', plugin.capabilities?.nativeCode || false);
  console.log('  Platforms:', plugin.compatibility.platforms?.join(', ') || 'all');
}

// ============================================================================
// Example 7: Get Documentation URLs
// ============================================================================

function getDocumentationUrls() {
  const manager = getPackageManager();

  const flutterUrl = manager.getDocumentationUrl('provider', 'flutter');
  const reactUrl = manager.getDocumentationUrl('axios', 'react');

  console.log('\nDocumentation URLs:');
  console.log('  Flutter (provider):', flutterUrl);
  console.log('  React (axios):', reactUrl);
}

// ============================================================================
// Example 8: Check Plugin Capabilities
// ============================================================================

function checkPluginCapabilities() {
  const registry = getPluginRegistry();

  const pluginName = 'lumora-ui-kit';
  
  console.log(`\nCapabilities for ${pluginName}:`);
  console.log('  Widgets:', registry.hasCapability(pluginName, 'widgets'));
  console.log('  State Management:', registry.hasCapability(pluginName, 'stateManagement'));
  console.log('  Navigation:', registry.hasCapability(pluginName, 'navigation'));
  console.log('  Networking:', registry.hasCapability(pluginName, 'networking'));
  console.log('  Storage:', registry.hasCapability(pluginName, 'storage'));
  console.log('  Native Code:', registry.hasCapability(pluginName, 'nativeCode'));

  // Get all plugins with specific capability
  const widgetPlugins = registry.getPluginsByCapability('widgets');
  console.log(`\nPlugins with widgets: ${widgetPlugins.length}`);
}

// ============================================================================
// Run Examples
// ============================================================================

function runExamples() {
  console.log('='.repeat(80));
  console.log('Lumora Plugin System Examples');
  console.log('='.repeat(80));

  console.log('\n--- Example 1: Register Custom Plugin ---');
  registerCustomPlugin();

  console.log('\n--- Example 2: Check Package Compatibility ---');
  checkPackageCompatibility();

  console.log('\n--- Example 3: Resolve Dependencies ---');
  resolveDependencies();

  console.log('\n--- Example 4: Get Plugin Widgets ---');
  getPluginWidgets();

  console.log('\n--- Example 5: Analyze Project ---');
  // analyzeProject('./my-project'); // Uncomment with real project path

  console.log('\n--- Example 6: Convert Package to Plugin ---');
  convertPackageToPlugin();

  console.log('\n--- Example 7: Get Documentation URLs ---');
  getDocumentationUrls();

  console.log('\n--- Example 8: Check Plugin Capabilities ---');
  checkPluginCapabilities();

  console.log('\n' + '='.repeat(80));
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}

export {
  registerCustomPlugin,
  checkPackageCompatibility,
  resolveDependencies,
  getPluginWidgets,
  analyzeProject,
  convertPackageToPlugin,
  getDocumentationUrls,
  checkPluginCapabilities,
};
