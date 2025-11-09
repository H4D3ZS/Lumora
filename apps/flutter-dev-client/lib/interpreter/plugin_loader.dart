import 'dart:convert';
import 'dart:developer' as developer;
import 'package:flutter/services.dart' show rootBundle;
import 'renderer_registry.dart';

/// Plugin manifest structure
class PluginManifest {
  final String name;
  final String version;
  final String compatibility;
  final List<RendererDeclaration> renderers;

  PluginManifest({
    required this.name,
    required this.version,
    required this.compatibility,
    required this.renderers,
  });

  factory PluginManifest.fromJson(Map<String, dynamic> json) {
    final renderersData = json['renderers'] as List<dynamic>? ?? [];
    final renderers = renderersData
        .whereType<Map<String, dynamic>>()
        .map((r) => RendererDeclaration.fromJson(r))
        .toList();

    return PluginManifest(
      name: json['name'] as String? ?? 'unknown',
      version: json['version'] as String? ?? '0.0.0',
      compatibility: json['compatibility'] as String? ?? '^1.0.0',
      renderers: renderers,
    );
  }
}

/// Renderer declaration in plugin manifest
class RendererDeclaration {
  final String type;
  final String className;
  final List<String> dependencies;

  RendererDeclaration({
    required this.type,
    required this.className,
    required this.dependencies,
  });

  factory RendererDeclaration.fromJson(Map<String, dynamic> json) {
    final depsData = json['dependencies'] as List<dynamic>? ?? [];
    final dependencies = depsData.whereType<String>().toList();

    return RendererDeclaration(
      type: json['type'] as String? ?? 'unknown',
      className: json['class'] as String? ?? 'UnknownRenderer',
      dependencies: dependencies,
    );
  }
}

/// Plugin loader for loading and registering custom renderers from plugin manifests
class PluginLoader {
  static const String supportedCompatibility = '1.0';

  /// Loads a plugin manifest from an asset path
  /// 
  /// Parameters:
  /// - assetPath: Path to the plugin manifest JSON file in assets
  /// 
  /// Returns: The parsed PluginManifest, or null if loading fails
  static Future<PluginManifest?> loadManifest(String assetPath) async {
    try {
      developer.log(
        'Loading plugin manifest from: $assetPath',
        name: 'PluginLoader',
      );

      final manifestString = await rootBundle.loadString(assetPath);
      final manifestJson = jsonDecode(manifestString) as Map<String, dynamic>;
      final manifest = PluginManifest.fromJson(manifestJson);

      developer.log(
        'Loaded plugin manifest: ${manifest.name} v${manifest.version}',
        name: 'PluginLoader',
      );

      return manifest;
    } catch (e, stackTrace) {
      developer.log(
        'Failed to load plugin manifest from $assetPath: $e',
        name: 'PluginLoader',
        error: e,
        stackTrace: stackTrace,
      );
      return null;
    }
  }

  /// Validates plugin compatibility with the current framework version
  /// 
  /// Parameters:
  /// - manifest: The plugin manifest to validate
  /// 
  /// Returns: true if compatible, false otherwise
  static bool validateCompatibility(PluginManifest manifest) {
    // Simple version check - in production, use proper semver parsing
    final compatibility = manifest.compatibility;
    
    // Check if compatibility string contains the supported version
    if (compatibility.contains(supportedCompatibility)) {
      developer.log(
        'Plugin ${manifest.name} is compatible (requires: $compatibility)',
        name: 'PluginLoader',
      );
      return true;
    }

    developer.log(
      'Plugin ${manifest.name} is not compatible. Requires: $compatibility, Current: $supportedCompatibility',
      name: 'PluginLoader',
      level: 900, // Warning level
    );
    return false;
  }

  /// Registers renderers from a plugin manifest into the registry
  /// 
  /// Note: This method only registers the renderer declarations.
  /// The actual renderer implementations must be provided separately
  /// through the rendererFactory callback.
  /// 
  /// Parameters:
  /// - manifest: The plugin manifest containing renderer declarations
  /// - registry: The RendererRegistry to register renderers into
  /// - rendererFactory: Optional callback to create renderer instances
  /// 
  /// Returns: The number of renderers successfully registered
  static int registerRenderersFromManifest(
    PluginManifest manifest,
    RendererRegistry registry, {
    RendererFunction Function(RendererDeclaration)? rendererFactory,
  }) {
    int registeredCount = 0;

    for (final declaration in manifest.renderers) {
      try {
        developer.log(
          'Registering renderer: ${declaration.type} (${declaration.className})',
          name: 'PluginLoader',
        );

        // If a factory is provided, use it to create the renderer
        if (rendererFactory != null) {
          final renderer = rendererFactory(declaration);
          registry.register(declaration.type, renderer);
          registeredCount++;
        } else {
          // Without a factory, we can only log the declaration
          developer.log(
            'Renderer declaration found but no factory provided: ${declaration.type}',
            name: 'PluginLoader',
            level: 900, // Warning level
          );
        }
      } catch (e, stackTrace) {
        developer.log(
          'Failed to register renderer ${declaration.type}: $e',
          name: 'PluginLoader',
          error: e,
          stackTrace: stackTrace,
        );
      }
    }

    developer.log(
      'Registered $registeredCount renderers from plugin ${manifest.name}',
      name: 'PluginLoader',
    );

    return registeredCount;
  }

  /// Loads a plugin and registers its renderers
  /// 
  /// This is a convenience method that combines loading, validation, and registration.
  /// 
  /// Parameters:
  /// - assetPath: Path to the plugin manifest JSON file
  /// - registry: The RendererRegistry to register renderers into
  /// - rendererFactory: Optional callback to create renderer instances
  /// 
  /// Returns: The number of renderers successfully registered, or 0 if loading fails
  static Future<int> loadAndRegisterPlugin(
    String assetPath,
    RendererRegistry registry, {
    RendererFunction Function(RendererDeclaration)? rendererFactory,
  }) async {
    // Load manifest
    final manifest = await loadManifest(assetPath);
    if (manifest == null) {
      return 0;
    }

    // Validate compatibility
    if (!validateCompatibility(manifest)) {
      developer.log(
        'Skipping plugin ${manifest.name} due to compatibility issues',
        name: 'PluginLoader',
        level: 900,
      );
      return 0;
    }

    // Register renderers
    return registerRenderersFromManifest(
      manifest,
      registry,
      rendererFactory: rendererFactory,
    );
  }

  /// Loads multiple plugins from a list of asset paths
  /// 
  /// Parameters:
  /// - assetPaths: List of paths to plugin manifest JSON files
  /// - registry: The RendererRegistry to register renderers into
  /// - rendererFactory: Optional callback to create renderer instances
  /// 
  /// Returns: The total number of renderers successfully registered
  static Future<int> loadPlugins(
    List<String> assetPaths,
    RendererRegistry registry, {
    RendererFunction Function(RendererDeclaration)? rendererFactory,
  }) async {
    int totalRegistered = 0;

    for (final assetPath in assetPaths) {
      final count = await loadAndRegisterPlugin(
        assetPath,
        registry,
        rendererFactory: rendererFactory,
      );
      totalRegistered += count;
    }

    developer.log(
      'Loaded ${assetPaths.length} plugins, registered $totalRegistered renderers',
      name: 'PluginLoader',
    );

    return totalRegistered;
  }
}
