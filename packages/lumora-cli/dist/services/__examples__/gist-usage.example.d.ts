/**
 * Example: Using GitHub Gist Manager and Loader
 *
 * Demonstrates how to create, share, and load Lumora projects via GitHub Gists.
 */
declare function exampleCreateGist(): Promise<import("../github-gist-manager").GistInfo>;
declare function exampleUpdateGist(gistId: string): Promise<void>;
declare function exampleForkGist(gistId: string): Promise<void>;
declare function exampleLoadGist(gistId: string): Promise<void>;
declare function exampleListGists(): Promise<void>;
declare function exampleUpdateGistProject(projectPath: string): Promise<void>;
export { exampleCreateGist, exampleUpdateGist, exampleForkGist, exampleLoadGist, exampleListGists, exampleUpdateGistProject, };
//# sourceMappingURL=gist-usage.example.d.ts.map