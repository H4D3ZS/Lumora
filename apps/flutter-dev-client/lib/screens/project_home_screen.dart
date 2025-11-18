/**
 * Project Home Screen
 * Main screen showing recent projects and project management
 */

import 'package:flutter/material.dart';
import '../services/project_manager.dart';
import 'project_details_screen.dart';

class ProjectHomeScreen extends StatefulWidget {
  const ProjectHomeScreen({Key? key}) : super(key: key);

  @override
  State<ProjectHomeScreen> createState() => _ProjectHomeScreenState();
}

class _ProjectHomeScreenState extends State<ProjectHomeScreen> {
  List<ProjectInfo> _recentProjects = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadRecentProjects();
  }

  Future<void> _loadRecentProjects() async {
    setState(() => _loading = true);
    try {
      final projects = await projectManager.getRecentProjects();
      setState(() {
        _recentProjects = projects;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      _showError('Failed to load recent projects: $e');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lumora Projects'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showCreateProjectDialog,
            tooltip: 'Create New Project',
          ),
          IconButton(
            icon: const Icon(Icons.folder_open),
            onPressed: _openExistingProject,
            tooltip: 'Open Existing Project',
          ),
        ],
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _recentProjects.isEmpty
          ? _buildEmptyState()
          : _buildProjectsList(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.folder_outlined,
            size: 100,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 24),
          Text(
            'No Recent Projects',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Create a new project or open an existing one to get started',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton.icon(
                onPressed: _showCreateProjectDialog,
                icon: const Icon(Icons.add),
                label: const Text('Create Project'),
              ),
              const SizedBox(width: 16),
              OutlinedButton.icon(
                onPressed: _openExistingProject,
                icon: const Icon(Icons.folder_open),
                label: const Text('Open Project'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProjectsList() {
    return RefreshIndicator(
      onRefresh: _loadRecentProjects,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _recentProjects.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                children: [
                  Text(
                    'Recent Projects',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: () => _showClearConfirmation(),
                    icon: const Icon(Icons.clear_all),
                    label: const Text('Clear All'),
                  ),
                ],
              ),
            );
          }

          final project = _recentProjects[index - 1];
          return _buildProjectCard(project);
        },
      ),
    );
  }

  Widget _buildProjectCard(ProjectInfo project) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _openProject(project),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Project icon/thumbnail
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: _getProjectColor(project.name),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    project.name.substring(0, 1).toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              // Project info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      project.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (project.description != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        project.description!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildChip('v${project.metadata.version}'),
                        const SizedBox(width: 8),
                        ...project.metadata.platforms.map(
                          (platform) => Padding(
                            padding: const EdgeInsets.only(right: 4),
                            child: _buildPlatformChip(platform),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Opened ${_formatLastOpened(project.lastOpened)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[500],
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              // Actions
              PopupMenuButton<String>(
                onSelected: (value) => _handleProjectAction(value, project),
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'open',
                    child: Row(
                      children: [
                        Icon(Icons.folder_open, size: 20),
                        SizedBox(width: 12),
                        Text('Open'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'details',
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, size: 20),
                        SizedBox(width: 12),
                        Text('Details'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'remove',
                    child: Row(
                      children: [
                        Icon(Icons.delete_outline, size: 20),
                        SizedBox(width: 12),
                        Text('Remove from List'),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
      ),
    );
  }

  Widget _buildPlatformChip(String platform) {
    IconData icon;
    Color color;

    switch (platform.toLowerCase()) {
      case 'ios':
        icon = Icons.phone_iphone;
        color = Colors.blue;
        break;
      case 'android':
        icon = Icons.android;
        color = Colors.green;
        break;
      case 'web':
        icon = Icons.language;
        color = Colors.orange;
        break;
      default:
        icon = Icons.devices;
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Icon(icon, size: 14, color: color),
    );
  }

  Color _getProjectColor(String name) {
    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.red,
      Colors.teal,
      Colors.indigo,
      Colors.pink,
    ];

    final hash = name.hashCode.abs();
    return colors[hash % colors.length];
  }

  String _formatLastOpened(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inMinutes < 1) {
      return 'just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  void _handleProjectAction(String action, ProjectInfo project) {
    switch (action) {
      case 'open':
        _openProject(project);
        break;
      case 'details':
        _showProjectDetails(project);
        break;
      case 'remove':
        _removeProject(project);
        break;
    }
  }

  void _openProject(ProjectInfo project) {
    // TODO: Implement project opening logic
    // This would connect to the project's dev server
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Opening ${project.name}...')),
    );
  }

  void _showProjectDetails(ProjectInfo project) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ProjectDetailsScreen(project: project),
      ),
    );
  }

  Future<void> _removeProject(ProjectInfo project) async {
    await projectManager.removeRecentProject(project.path);
    _loadRecentProjects();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${project.name} removed from recent projects')),
    );
  }

  void _showCreateProjectDialog() {
    final nameController = TextEditingController();
    final descriptionController = TextEditingController();
    final pathController = TextEditingController(text: '/path/to/projects');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create New Project'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Project Name',
                  hintText: 'my-awesome-app',
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description (optional)',
                  hintText: 'What is your app about?',
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: pathController,
                decoration: const InputDecoration(
                  labelText: 'Location',
                  hintText: '/path/to/projects',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.isEmpty) {
                _showError('Please enter a project name');
                return;
              }

              Navigator.of(context).pop();

              try {
                final projectPath = await projectManager.createProject(
                  name: nameController.text,
                  path: pathController.text,
                  description: descriptionController.text.isEmpty
                    ? null
                    : descriptionController.text,
                );

                final projectInfo = await projectManager.loadProjectInfo(projectPath);
                if (projectInfo != null) {
                  await projectManager.addRecentProject(projectInfo);
                  _loadRecentProjects();
                }

                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Project created: ${nameController.text}')),
                );
              } catch (e) {
                _showError('Failed to create project: $e');
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  void _openExistingProject() {
    // TODO: Implement file picker to select project directory
    _showError('File picker not yet implemented');
  }

  void _showClearConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Recent Projects'),
        content: const Text(
          'Are you sure you want to clear all recent projects? This will not delete the projects themselves.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await projectManager.clearRecentProjects();
              _loadRecentProjects();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }
}
