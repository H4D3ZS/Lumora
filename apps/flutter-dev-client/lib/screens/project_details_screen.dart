/**
 * Project Details Screen
 * Shows detailed information about a project and allows configuration
 */

import 'package:flutter/material.dart';
import '../services/project_manager.dart';

class ProjectDetailsScreen extends StatefulWidget {
  final ProjectInfo project;

  const ProjectDetailsScreen({
    Key? key,
    required this.project,
  }) : super(key: key);

  @override
  State<ProjectDetailsScreen> createState() => _ProjectDetailsScreenState();
}

class _ProjectDetailsScreenState extends State<ProjectDetailsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? _projectStats;
  bool _loadingStats = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadProjectStats();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadProjectStats() async {
    setState(() => _loadingStats = true);
    try {
      final stats = await projectManager.getProjectStats(widget.project.path);
      setState(() {
        _projectStats = stats;
        _loadingStats = false;
      });
    } catch (e) {
      setState(() => _loadingStats = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.project.name),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.info_outline), text: 'Overview'),
            Tab(icon: Icon(Icons.settings), text: 'Configuration'),
            Tab(icon: Icon(Icons.store), text: 'App Store'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildOverviewTab(),
          _buildConfigurationTab(),
          _buildAppStoreTab(),
        ],
      ),
    );
  }

  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Project Header
          Row(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: _getProjectColor(widget.project.name),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    widget.project.name.substring(0, 1).toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 40,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.project.name,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (widget.project.description != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        widget.project.description!,
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Project Info Cards
          _buildInfoCard(
            'Version',
            widget.project.metadata.version,
            Icons.tag,
            Colors.blue,
          ),
          const SizedBox(height: 12),

          _buildInfoCard(
            'Location',
            widget.project.path,
            Icons.folder,
            Colors.orange,
          ),
          const SizedBox(height: 12),

          _buildInfoCard(
            'Last Opened',
            _formatDateTime(widget.project.lastOpened),
            Icons.access_time,
            Colors.purple,
          ),
          const SizedBox(height: 24),

          // Platforms
          Text(
            'Platforms',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: widget.project.metadata.platforms.map((platform) {
              return Chip(
                avatar: Icon(_getPlatformIcon(platform), size: 18),
                label: Text(platform.toUpperCase()),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),

          // Project Statistics
          if (_loadingStats)
            const Center(child: CircularProgressIndicator())
          else if (_projectStats != null) ...[
            Text(
              'Statistics',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildStatRow('Files', '${_projectStats!['fileCount']}'),
                    const Divider(),
                    _buildStatRow('Lines of Code', '${_projectStats!['totalLines']}'),
                    const Divider(),
                    _buildStatRow('File Types', _buildFileTypesText()),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Dependencies
          if (widget.project.metadata.dependencies != null) ...[
            Text(
              'Dependencies',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: widget.project.metadata.dependencies!.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final dep = widget.project.metadata.dependencies!.entries.elementAt(index);
                  return ListTile(
                    title: Text(dep.key),
                    trailing: Text(
                      dep.value.toString(),
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildConfigurationTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildConfigSection(
            'iOS Configuration',
            [
              _buildConfigItem(
                'Bundle Identifier',
                widget.project.metadata.bundleId ?? 'Not set',
                Icons.apple,
              ),
            ],
          ),
          const SizedBox(height: 24),
          _buildConfigSection(
            'Android Configuration',
            [
              _buildConfigItem(
                'Package Name',
                widget.project.metadata.packageName ?? 'Not set',
                Icons.android,
              ),
            ],
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _editConfiguration,
            icon: const Icon(Icons.edit),
            label: const Text('Edit Configuration'),
          ),
        ],
      ),
    );
  }

  Widget _buildAppStoreTab() {
    final appStore = widget.project.metadata.appStore;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (appStore == null) ...[
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.store, size: 80, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'App Store Not Configured',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Configure your app store settings to publish your app',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: _configureAppStore,
                    icon: const Icon(Icons.settings),
                    label: const Text('Configure App Store'),
                  ),
                ],
              ),
            ),
          ] else ...[
            _buildConfigSection(
              'Apple App Store',
              [
                _buildConfigItem(
                  'Apple ID',
                  appStore.appleId ?? 'Not set',
                  Icons.person,
                ),
                _buildConfigItem(
                  'Team ID',
                  appStore.teamId ?? 'Not set',
                  Icons.group,
                ),
                _buildConfigItem(
                  'TestFlight',
                  appStore.testFlightEnabled ? 'Enabled' : 'Disabled',
                  Icons.flight,
                ),
              ],
            ),
            const SizedBox(height: 24),
            _buildConfigSection(
              'Google Play Store',
              [
                _buildConfigItem(
                  'Service Account',
                  appStore.playStoreServiceAccount ?? 'Not set',
                  Icons.account_circle,
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                ElevatedButton.icon(
                  onPressed: _configureAppStore,
                  icon: const Icon(Icons.edit),
                  label: const Text('Edit Settings'),
                ),
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  onPressed: _generateStoreAssets,
                  icon: const Icon(Icons.image),
                  label: const Text('Generate Assets'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color),
        ),
        title: Text(title),
        subtitle: Text(value),
      ),
    );
  }

  Widget _buildConfigSection(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: items,
          ),
        ),
      ],
    );
  }

  Widget _buildConfigItem(String label, String value, IconData icon) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      subtitle: Text(value),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
        Text(value, style: TextStyle(color: Colors.grey[600])),
      ],
    );
  }

  String _buildFileTypesText() {
    if (_projectStats == null) return '';
    final extensions = _projectStats!['extensions'] as Map<String, int>;
    return extensions.entries
      .map((e) => '${e.key}: ${e.value}')
      .join(', ');
  }

  Color _getProjectColor(String name) {
    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.red,
      Colors.teal,
    ];
    return colors[name.hashCode.abs() % colors.length];
  }

  IconData _getPlatformIcon(String platform) {
    switch (platform.toLowerCase()) {
      case 'ios':
        return Icons.phone_iphone;
      case 'android':
        return Icons.android;
      case 'web':
        return Icons.language;
      default:
        return Icons.devices;
    }
  }

  String _formatDateTime(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  void _editConfiguration() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Configuration editor not yet implemented')),
    );
  }

  void _configureAppStore() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('App Store configuration not yet implemented')),
    );
  }

  void _generateStoreAssets() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Asset generation not yet implemented')),
    );
  }
}
