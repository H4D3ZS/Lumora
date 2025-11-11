/**
 * GitHub Client Usage Examples
 * 
 * This file demonstrates how to use the GitHub client and repository services.
 * These are examples only and should not be executed directly.
 */

import { createGitHubClient, createGitHubRepository } from '../index';

async function exampleUsage() {
  // ============================================================================
  // 1. Create and Configure GitHub Client
  // ============================================================================

  const client = createGitHubClient({
    auth: {
      type: 'pat', // or 'oauth'
      token: process.env.GITHUB_TOKEN || 'your-token-here',
    },
    userAgent: 'lumora-cli/0.1.0',
  });

  // Verify authentication
  try {
    const user = await client.verifyAuth();
    console.log(`✓ Authenticated as: ${user.login} (${user.name})`);
  } catch (error: any) {
    console.error('✗ Authentication failed:', error.message);
    return;
  }

  // Check rate limit
  const rateLimit = await client.getRateLimit();
  console.log(
    `Rate limit: ${rateLimit.remaining}/${rateLimit.limit} requests remaining`
  );
  console.log(`Resets at: ${rateLimit.reset.toLocaleString()}`);

  // ============================================================================
  // 2. Create Repository Manager
  // ============================================================================

  const repo = createGitHubRepository(client);

  // ============================================================================
  // 3. Create a New Repository
  // ============================================================================

  try {
    const newRepo = await repo.createRepository({
      name: 'my-lumora-app',
      description: 'A mobile app built with Lumora',
      private: false,
      autoInit: true,
      gitignoreTemplate: 'Node',
      licenseTemplate: 'mit',
    });

    console.log(`✓ Repository created: ${newRepo.htmlUrl}`);
    console.log(`  Clone URL: ${newRepo.cloneUrl}`);
    console.log(`  Default branch: ${newRepo.defaultBranch}`);
  } catch (error: any) {
    console.error('✗ Failed to create repository:', error.message);
  }

  // ============================================================================
  // 4. Check if Repository Exists
  // ============================================================================

  const exists = await repo.repositoryExists('username', 'my-lumora-app');
  console.log(`Repository exists: ${exists}`);

  // ============================================================================
  // 5. Get Repository Information
  // ============================================================================

  try {
    const repoInfo = await repo.getRepository('username', 'my-lumora-app');
    console.log(`Repository: ${repoInfo.fullName}`);
    console.log(`Description: ${repoInfo.description}`);
    console.log(`Private: ${repoInfo.private}`);
    console.log(`Created: ${repoInfo.createdAt.toLocaleDateString()}`);
  } catch (error: any) {
    console.error('✗ Failed to get repository:', error.message);
  }

  // ============================================================================
  // 6. Commit a Single File
  // ============================================================================

  const schema = {
    version: '1.0',
    nodes: [
      {
        type: 'View',
        props: { style: { padding: 20 } },
        children: [
          {
            type: 'Text',
            props: { text: 'Hello, Lumora!' },
          },
        ],
      },
    ],
  };

  try {
    const commitResult = await repo.commitFile({
      owner: 'username',
      repo: 'my-lumora-app',
      path: 'schema.json',
      message: 'Add initial app schema',
      content: JSON.stringify(schema, null, 2),
      branch: 'main',
    });

    console.log(`✓ File committed: ${commitResult.sha}`);
    console.log(`  URL: ${commitResult.url}`);
  } catch (error: any) {
    console.error('✗ Failed to commit file:', error.message);
  }

  // ============================================================================
  // 7. Get File Content
  // ============================================================================

  try {
    const { content, sha } = await repo.getFileContent(
      'username',
      'my-lumora-app',
      'schema.json'
    );

    console.log('✓ File content retrieved');
    console.log(`  SHA: ${sha}`);
    console.log(`  Content: ${content.substring(0, 100)}...`);

    // Parse and use the content
    const parsedSchema = JSON.parse(content);
    console.log(`  Schema version: ${parsedSchema.version}`);
  } catch (error: any) {
    console.error('✗ Failed to get file content:', error.message);
  }

  // ============================================================================
  // 8. Update an Existing File
  // ============================================================================

  try {
    // First, get the current file to get its SHA
    const { content: currentContent, sha } = await repo.getFileContent(
      'username',
      'my-lumora-app',
      'schema.json'
    );

    // Modify the content
    const currentSchema = JSON.parse(currentContent);
    currentSchema.nodes[0].children.push({
      type: 'Button',
      props: { title: 'Click me!' },
    });

    // Commit the update (SHA is required for updates)
    const updateResult = await repo.commitFile({
      owner: 'username',
      repo: 'my-lumora-app',
      path: 'schema.json',
      message: 'Add button to schema',
      content: JSON.stringify(currentSchema, null, 2),
      branch: 'main',
      sha, // Required for updates
    });

    console.log(`✓ File updated: ${updateResult.sha}`);
  } catch (error: any) {
    console.error('✗ Failed to update file:', error.message);
  }

  // ============================================================================
  // 9. Commit Multiple Files at Once
  // ============================================================================

  try {
    const multiCommitResult = await repo.commitFiles(
      'username',
      'my-lumora-app',
      'main',
      'Initial project setup',
      [
        {
          path: 'README.md',
          content: '# My Lumora App\n\nBuilt with Lumora framework.',
        },
        {
          path: 'package.json',
          content: JSON.stringify(
            {
              name: 'my-lumora-app',
              version: '1.0.0',
              dependencies: {
                'lumora-cli': '^0.1.0',
              },
            },
            null,
            2
          ),
        },
        {
          path: 'schema.json',
          content: JSON.stringify(schema, null, 2),
        },
      ]
    );

    console.log(`✓ Multiple files committed: ${multiCommitResult.sha}`);
  } catch (error: any) {
    console.error('✗ Failed to commit multiple files:', error.message);
  }

  // ============================================================================
  // 10. List and Create Branches
  // ============================================================================

  try {
    // List all branches
    const branches = await repo.listBranches('username', 'my-lumora-app');
    console.log(`✓ Branches: ${branches.join(', ')}`);

    // Create a new branch
    await repo.createBranch(
      'username',
      'my-lumora-app',
      'feature/new-ui',
      'main'
    );
    console.log('✓ Branch created: feature/new-ui');
  } catch (error: any) {
    console.error('✗ Failed to manage branches:', error.message);
  }

  // ============================================================================
  // 11. Get Directory Contents
  // ============================================================================

  try {
    const contents = await repo.getContents('username', 'my-lumora-app', '');

    if (Array.isArray(contents)) {
      console.log('✓ Repository contents:');
      contents.forEach((item) => {
        console.log(`  ${item.type === 'dir' ? '📁' : '📄'} ${item.name}`);
      });
    }
  } catch (error: any) {
    console.error('✗ Failed to get contents:', error.message);
  }

  // ============================================================================
  // 12. Update Repository Settings
  // ============================================================================

  try {
    const updatedRepo = await repo.updateRepository(
      'username',
      'my-lumora-app',
      {
        description: 'An awesome mobile app built with Lumora framework',
        private: false,
      }
    );

    console.log(`✓ Repository updated: ${updatedRepo.description}`);
  } catch (error: any) {
    console.error('✗ Failed to update repository:', error.message);
  }

  // ============================================================================
  // 13. Delete a File
  // ============================================================================

  try {
    // Get the file SHA first
    const { sha } = await repo.getFileContent(
      'username',
      'my-lumora-app',
      'old-file.txt'
    );

    // Delete the file
    const deleteResult = await repo.deleteFile(
      'username',
      'my-lumora-app',
      'old-file.txt',
      'Remove old file',
      sha
    );

    console.log(`✓ File deleted: ${deleteResult.sha}`);
  } catch (error: any) {
    console.error('✗ Failed to delete file:', error.message);
  }

  // ============================================================================
  // 14. Error Handling Examples
  // ============================================================================

  // Handle authentication errors
  try {
    await client.verifyAuth();
  } catch (error: any) {
    if (error.type === 'auth') {
      console.error('Authentication failed. Please check your token.');
    }
  }

  // Handle rate limit errors
  try {
    await repo.getRepository('username', 'my-lumora-app');
  } catch (error: any) {
    if (error.type === 'rate_limit') {
      console.error('Rate limit exceeded. Please wait and try again.');
      const rateLimit = await client.getRateLimit();
      console.log(`Resets at: ${rateLimit.reset.toLocaleString()}`);
    }
  }

  // Handle not found errors
  try {
    await repo.getRepository('username', 'non-existent-repo');
  } catch (error: any) {
    if (error.type === 'not_found') {
      console.error('Repository not found.');
    }
  }

  // ============================================================================
  // 15. Advanced: Use Octokit Directly
  // ============================================================================

  // For operations not covered by the wrapper, use Octokit directly
  const octokit = client.getOctokit();

  try {
    // Example: Get repository collaborators
    const { data: collaborators } = await octokit.repos.listCollaborators({
      owner: 'username',
      repo: 'my-lumora-app',
    });

    console.log('✓ Collaborators:');
    collaborators.forEach((collab) => {
      console.log(`  - ${collab.login} (${collab.permissions?.admin ? 'admin' : 'member'})`);
    });
  } catch (error: any) {
    console.error('✗ Failed to get collaborators:', error.message);
  }
}

// Note: This is an example file and should not be executed directly
// To use these examples, copy the relevant code into your application
export { exampleUsage };
