/**
 * Project Manager Service
 * Manages Lumora projects, recent projects, and project metadata
 */

import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ProjectInfo {
  final String name;
  final String path;
  final String? description;
  final DateTime lastOpened;
  final String? thumbnail;
  final ProjectMetadata metadata;

  ProjectInfo({
    required this.name,
    required this.path,
    this.description,
    required this.lastOpened,
    this.thumbnail,
    required this.metadata,
  });

  Map<String, dynamic> toJson() => {
    'name': name,
    'path': path,
    'description': description,
    'lastOpened': lastOpened.toIso8601String(),
    'thumbnail': thumbnail,
    'metadata': metadata.toJson(),
  };

  factory ProjectInfo.fromJson(Map<String, dynamic> json) => ProjectInfo(
    name: json['name'] as String,
    path: json['path'] as String,
    description: json['description'] as String?,
    lastOpened: DateTime.parse(json['lastOpened'] as String),
    thumbnail: json['thumbnail'] as String?,
    metadata: ProjectMetadata.fromJson(json['metadata'] as Map<String, dynamic>),
  );
}

class ProjectMetadata {
  final String version;
  final String? bundleId;
  final String? packageName;
  final List<String> platforms;
  final Map<String, dynamic>? dependencies;
  final AppStoreConfig? appStore;

  ProjectMetadata({
    required this.version,
    this.bundleId,
    this.packageName,
    required this.platforms,
    this.dependencies,
    this.appStore,
  });

  Map<String, dynamic> toJson() => {
    'version': version,
    'bundleId': bundleId,
    'packageName': packageName,
    'platforms': platforms,
    'dependencies': dependencies,
    'appStore': appStore?.toJson(),
  };

  factory ProjectMetadata.fromJson(Map<String, dynamic> json) => ProjectMetadata(
    version: json['version'] as String,
    bundleId: json['bundleId'] as String?,
    packageName: json['packageName'] as String?,
    platforms: (json['platforms'] as List).cast<String>(),
    dependencies: json['dependencies'] as Map<String, dynamic>?,
    appStore: json['appStore'] != null
      ? AppStoreConfig.fromJson(json['appStore'] as Map<String, dynamic>)
      : null,
  );
}

class AppStoreConfig {
  final String? appleId;
  final String? teamId;
  final String? provisioningProfile;
  final String? certificate;
  final bool testFlightEnabled;
  final String? playStoreServiceAccount;
  final String? playStoreKeyFile;

  AppStoreConfig({
    this.appleId,
    this.teamId,
    this.provisioningProfile,
    this.certificate,
    this.testFlightEnabled = false,
    this.playStoreServiceAccount,
    this.playStoreKeyFile,
  });

  Map<String, dynamic> toJson() => {
    'appleId': appleId,
    'teamId': teamId,
    'provisioningProfile': provisioningProfile,
    'certificate': certificate,
    'testFlightEnabled': testFlightEnabled,
    'playStoreServiceAccount': playStoreServiceAccount,
    'playStoreKeyFile': playStoreKeyFile,
  };

  factory AppStoreConfig.fromJson(Map<String, dynamic> json) => AppStoreConfig(
    appleId: json['appleId'] as String?,
    teamId: json['teamId'] as String?,
    provisioningProfile: json['provisioningProfile'] as String?,
    certificate: json['certificate'] as String?,
    testFlightEnabled: json['testFlightEnabled'] as bool? ?? false,
    playStoreServiceAccount: json['playStoreServiceAccount'] as String?,
    playStoreKeyFile: json['playStoreKeyFile'] as String?,
  );
}

class ProjectManager {
  static const String _recentProjectsKey = 'lumora_recent_projects';
  static const int _maxRecentProjects = 10;

  Future<List<ProjectInfo>> getRecentProjects() async {
    final prefs = await SharedPreferences.getInstance();
    final String? projectsJson = prefs.getString(_recentProjectsKey);

    if (projectsJson == null) return [];

    final List<dynamic> projectsList = json.decode(projectsJson);
    return projectsList
      .map((json) => ProjectInfo.fromJson(json as Map<String, dynamic>))
      .toList();
  }

  Future<void> addRecentProject(ProjectInfo project) async {
    final projects = await getRecentProjects();

    // Remove if already exists
    projects.removeWhere((p) => p.path == project.path);

    // Add to beginning
    projects.insert(0, project);

    // Keep only last N projects
    if (projects.length > _maxRecentProjects) {
      projects.removeRange(_maxRecentProjects, projects.length);
    }

    await _saveRecentProjects(projects);
  }

  Future<void> removeRecentProject(String path) async {
    final projects = await getRecentProjects();
    projects.removeWhere((p) => p.path == path);
    await _saveRecentProjects(projects);
  }

  Future<void> clearRecentProjects() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_recentProjectsKey);
  }

  Future<void> _saveRecentProjects(List<ProjectInfo> projects) async {
    final prefs = await SharedPreferences.getInstance();
    final projectsJson = json.encode(
      projects.map((p) => p.toJson()).toList(),
    );
    await prefs.setString(_recentProjectsKey, projectsJson);
  }

  Future<ProjectInfo?> loadProjectInfo(String projectPath) async {
    try {
      // Read lumora.config.json
      final configFile = File('$projectPath/lumora.config.json');
      if (!await configFile.exists()) {
        return null;
      }

      final configContent = await configFile.readAsString();
      final config = json.decode(configContent) as Map<String, dynamic>;

      // Read package.json
      final packageFile = File('$projectPath/package.json');
      Map<String, dynamic>? packageJson;
      if (await packageFile.exists()) {
        final packageContent = await packageFile.readAsString();
        packageJson = json.decode(packageContent) as Map<String, dynamic>;
      }

      return ProjectInfo(
        name: config['name'] as String? ?? 'Unnamed Project',
        path: projectPath,
        description: config['description'] as String?,
        lastOpened: DateTime.now(),
        metadata: ProjectMetadata(
          version: packageJson?['version'] as String? ?? '1.0.0',
          bundleId: config['ios']?['bundleIdentifier'] as String?,
          packageName: config['android']?['package'] as String?,
          platforms: (config['platforms'] as List?)?.cast<String>() ?? ['ios', 'android'],
          dependencies: packageJson?['dependencies'] as Map<String, dynamic>?,
          appStore: config['appStore'] != null
            ? AppStoreConfig.fromJson(config['appStore'] as Map<String, dynamic>)
            : null,
        ),
      );
    } catch (e) {
      print('Error loading project info: $e');
      return null;
    }
  }

  Future<void> saveProjectConfig(String projectPath, Map<String, dynamic> config) async {
    try {
      final configFile = File('$projectPath/lumora.config.json');
      final configJson = JsonEncoder.withIndent('  ').convert(config);
      await configFile.writeAsString(configJson);
    } catch (e) {
      print('Error saving project config: $e');
      rethrow;
    }
  }

  Future<String> createProject({
    required String name,
    required String path,
    String? description,
    String? template,
  }) async {
    final projectDir = Directory('$path/$name');

    if (await projectDir.exists()) {
      throw Exception('Project already exists at ${projectDir.path}');
    }

    await projectDir.create(recursive: true);

    // Create basic project structure
    await Directory('${projectDir.path}/src').create();
    await Directory('${projectDir.path}/src/components').create();
    await Directory('${projectDir.path}/src/screens').create();
    await Directory('${projectDir.path}/assets').create();
    await Directory('${projectDir.path}/assets/images').create();
    await Directory('${projectDir.path}/assets/fonts').create();

    // Create lumora.config.json
    final config = {
      'name': name,
      'description': description,
      'version': '1.0.0',
      'platforms': ['ios', 'android', 'web'],
      'ios': {
        'bundleIdentifier': 'com.example.$name',
      },
      'android': {
        'package': 'com.example.$name',
      },
    };

    await saveProjectConfig(projectDir.path, config);

    // Create package.json
    final packageJson = {
      'name': name,
      'version': '1.0.0',
      'description': description ?? 'A Lumora project',
      'main': 'src/index.tsx',
      'scripts': {
        'start': 'lumora start',
        'build': 'lumora build',
      },
      'dependencies': {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
      },
      'devDependencies': {
        'typescript': '^5.0.0',
        '@types/react': '^18.2.0',
      },
    };

    final packageFile = File('${projectDir.path}/package.json');
    await packageFile.writeAsString(
      JsonEncoder.withIndent('  ').convert(packageJson),
    );

    // Create basic App.tsx
    final appTsx = '''
import React from 'react';

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome to $name!</h1>
      <p>Start editing to see changes in real-time.</p>
    </div>
  );
}
''';

    final appFile = File('${projectDir.path}/src/App.tsx');
    await appFile.writeAsString(appTsx);

    // Create index.tsx
    final indexTsx = '''
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
''';

    final indexFile = File('${projectDir.path}/src/index.tsx');
    await indexFile.writeAsString(indexTsx);

    // Create README
    final readme = '''
# $name

${description ?? 'A Lumora project'}

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
lumora start
\`\`\`

## Available Scripts

- \`lumora start\` - Start development server
- \`lumora build\` - Build for production
- \`lumora publish\` - Publish OTA update

## Learn More

Visit [lumora.dev](https://lumora.dev) for documentation.
''';

    final readmeFile = File('${projectDir.path}/README.md');
    await readmeFile.writeAsString(readme);

    return projectDir.path;
  }

  Future<Map<String, dynamic>> getProjectStats(String projectPath) async {
    int fileCount = 0;
    int totalLines = 0;
    final extensions = <String, int>{};

    await for (final entity in Directory(projectPath).list(recursive: true)) {
      if (entity is File) {
        final ext = entity.path.split('.').last;
        if (['ts', 'tsx', 'js', 'jsx', 'dart'].contains(ext)) {
          fileCount++;
          extensions[ext] = (extensions[ext] ?? 0) + 1;

          try {
            final lines = await entity.readAsLines();
            totalLines += lines.length;
          } catch (e) {
            // Skip files that can't be read
          }
        }
      }
    }

    return {
      'fileCount': fileCount,
      'totalLines': totalLines,
      'extensions': extensions,
    };
  }
}

// Singleton instance
final projectManager = ProjectManager();
