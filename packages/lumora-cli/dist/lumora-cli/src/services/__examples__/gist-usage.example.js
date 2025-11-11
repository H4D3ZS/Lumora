"use strict";
/**
 * Example: Using GitHub Gist Manager and Loader
 *
 * Demonstrates how to create, share, and load Lumora projects via GitHub Gists.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleCreateGist = exampleCreateGist;
exports.exampleUpdateGist = exampleUpdateGist;
exports.exampleForkGist = exampleForkGist;
exports.exampleLoadGist = exampleLoadGist;
exports.exampleListGists = exampleListGists;
exports.exampleUpdateGistProject = exampleUpdateGistProject;
const index_1 = require("../index");
async function exampleCreateGist() {
    // Create GitHub client with authentication
    const client = (0, index_1.createGitHubClient)({
        auth: {
            type: 'pat',
            token: process.env.GITHUB_TOKEN || 'your-token-here',
        },
    });
    // Create gist manager
    const gistManager = (0, index_1.createGitHubGistManager)(client);
    // Create a new gist for a Lumora project
    const gist = await gistManager.createProjectGist('my-todo-app', [
        {
            path: 'App.tsx',
            content: `
import React, { useState } from 'react';

export default function App() {
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input]);
      setInput('');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Todo App</Text>
      <TextInput
        value={input}
        onChange={setInput}
        placeholder="Enter todo"
      />
      <Button title="Add" onPress={addTodo} />
      {todos.map((todo, index) => (
        <Text key={index}>{todo}</Text>
      ))}
    </View>
  );
}
        `.trim(),
        },
        {
            path: 'package.json',
            content: JSON.stringify({
                name: 'my-todo-app',
                version: '1.0.0',
                dependencies: {
                    react: '^18.0.0',
                },
            }, null, 2),
        },
        {
            path: 'schema.json',
            content: JSON.stringify({
                schemaVersion: '1.0',
                nodes: [],
            }, null, 2),
        },
    ], 'A simple todo app built with Lumora');
    console.log('✅ Gist created successfully!');
    console.log(`   ID: ${gist.id}`);
    console.log(`   URL: ${gist.htmlUrl}`);
    console.log(`   Files: ${gist.files.size}`);
    // Generate shareable URLs
    const urls = gistManager.generateShareableUrls(gist.id);
    console.log('\n📤 Share your project:');
    console.log(`   View: ${urls.htmlUrl}`);
    console.log(`   Raw: ${urls.rawUrl}`);
    console.log(`   Embed: ${urls.embedUrl}`);
    return gist;
}
async function exampleUpdateGist(gistId) {
    const client = (0, index_1.createGitHubClient)({
        auth: {
            type: 'pat',
            token: process.env.GITHUB_TOKEN || 'your-token-here',
        },
    });
    const gistManager = (0, index_1.createGitHubGistManager)(client);
    // Update an existing gist
    const updatedGist = await gistManager.updateGist({
        gistId,
        description: 'Updated: A simple todo app built with Lumora',
        files: [
            {
                filename: 'App.tsx',
                content: '// Updated content here',
            },
        ],
    });
    console.log('✅ Gist updated successfully!');
    console.log(`   Updated at: ${updatedGist.updatedAt}`);
}
async function exampleForkGist(gistId) {
    const client = (0, index_1.createGitHubClient)({
        auth: {
            type: 'pat',
            token: process.env.GITHUB_TOKEN || 'your-token-here',
        },
    });
    const gistManager = (0, index_1.createGitHubGistManager)(client);
    // Fork an existing gist
    const forkedGist = await gistManager.forkGist(gistId);
    console.log('✅ Gist forked successfully!');
    console.log(`   New ID: ${forkedGist.id}`);
    console.log(`   URL: ${forkedGist.htmlUrl}`);
    console.log(`   Owner: ${forkedGist.owner}`);
}
async function exampleLoadGist(gistId) {
    const client = (0, index_1.createGitHubClient)({
        auth: {
            type: 'pat',
            token: process.env.GITHUB_TOKEN || 'your-token-here',
        },
    });
    const gistManager = (0, index_1.createGitHubGistManager)(client);
    const gistLoader = (0, index_1.createGitHubGistLoader)(gistManager);
    // Preview gist before loading
    const preview = await gistLoader.previewGist(gistId);
    console.log('📋 Gist Preview:');
    console.log(`   Project: ${preview.project.name}`);
    console.log(`   Files: ${preview.project.files.size}`);
    console.log(`   Valid: ${preview.validation.valid}`);
    if (preview.validation.warnings.length > 0) {
        console.log('   Warnings:');
        preview.validation.warnings.forEach(w => console.log(`     - ${w}`));
    }
    // Load gist into local workspace
    const result = await gistLoader.loadGist({
        gistId,
        outputDir: './projects',
        overwrite: false,
        includeReadme: true,
    });
    console.log('\n✅ Gist loaded successfully!');
    console.log(`   Project: ${result.projectName}`);
    console.log(`   Path: ${result.projectPath}`);
    console.log(`   Files written: ${result.filesWritten.length}`);
    result.filesWritten.forEach(f => console.log(`     - ${f}`));
}
async function exampleListGists() {
    const client = (0, index_1.createGitHubClient)({
        auth: {
            type: 'pat',
            token: process.env.GITHUB_TOKEN || 'your-token-here',
        },
    });
    const gistManager = (0, index_1.createGitHubGistManager)(client);
    // List all gists for authenticated user
    const gists = await gistManager.listGists({ perPage: 10 });
    console.log(`📚 Your Gists (${gists.length}):`);
    gists.forEach(gist => {
        console.log(`\n   ${gist.description || 'Untitled'}`);
        console.log(`   ID: ${gist.id}`);
        console.log(`   Files: ${gist.files.size}`);
        console.log(`   Public: ${gist.public ? 'Yes' : 'No'}`);
        console.log(`   URL: ${gist.htmlUrl}`);
    });
}
async function exampleUpdateGistProject(projectPath) {
    const client = (0, index_1.createGitHubClient)({
        auth: {
            type: 'pat',
            token: process.env.GITHUB_TOKEN || 'your-token-here',
        },
    });
    const gistManager = (0, index_1.createGitHubGistManager)(client);
    const gistLoader = (0, index_1.createGitHubGistLoader)(gistManager);
    // Check if project is from a gist
    const isGistProject = await gistLoader.isGistProject(projectPath);
    if (!isGistProject) {
        console.log('❌ Not a gist-loaded project');
        return;
    }
    // Update project from gist
    const result = await gistLoader.updateGistProject(projectPath);
    console.log('✅ Project updated from gist!');
    console.log(`   Files updated: ${result.filesWritten.length}`);
}
// Example CLI usage
async function main() {
    const command = process.argv[2];
    const arg = process.argv[3];
    try {
        switch (command) {
            case 'create':
                await exampleCreateGist();
                break;
            case 'update':
                if (!arg)
                    throw new Error('Gist ID required');
                await exampleUpdateGist(arg);
                break;
            case 'fork':
                if (!arg)
                    throw new Error('Gist ID required');
                await exampleForkGist(arg);
                break;
            case 'load':
                if (!arg)
                    throw new Error('Gist ID required');
                await exampleLoadGist(arg);
                break;
            case 'list':
                await exampleListGists();
                break;
            case 'update-project':
                if (!arg)
                    throw new Error('Project path required');
                await exampleUpdateGistProject(arg);
                break;
            default:
                console.log('Usage:');
                console.log('  npm run example:gist create');
                console.log('  npm run example:gist update <gist-id>');
                console.log('  npm run example:gist fork <gist-id>');
                console.log('  npm run example:gist load <gist-id>');
                console.log('  npm run example:gist list');
                console.log('  npm run example:gist update-project <project-path>');
        }
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}
// Run if executed directly
if (require.main === module) {
    main();
}
//# sourceMappingURL=gist-usage.example.js.map