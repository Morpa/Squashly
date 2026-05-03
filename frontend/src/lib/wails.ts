// Types mirroring Go structs
export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  email: string;
  date: string;
  body: string;
  selected?: boolean;
}

export interface Branch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
}

export interface RepoInfo {
  path: string;
  name: string;
  currentBranch: string;
  totalCommits: number;
  hasUncommitted: boolean;
}

export interface SquashRequest {
  repoPath: string;
  commitHashes: string[];
  message: string;
  body: string;
}

export interface SquashResult {
  success: boolean;
  newHash: string;
  message: string;
  errorMsg?: string;
}

// Wails runtime bindings - these are injected at runtime by Wails
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;

function wailsCall<T>(method: string, ...args: unknown[]): Promise<T> {
  if (typeof window.go !== "undefined") {
    return window.go.app.App[method](...args);
  }
  // Dev mock
  return mockApi(method, ...args) as Promise<T>;
}

// Mock data for browser development
function mockApi(method: string, ...args: unknown[]): unknown {
  console.log("[mock]", method, args);
  const mockCommits: Commit[] = Array.from({ length: 20 }, (_, i) => ({
    hash: `abc${i}def${i}123456`,
    shortHash: `abc${i}def`,
    message: [
      "feat: add user authentication flow",
      "fix: resolve race condition in queue processor",
      "refactor: extract payment service interface",
      "chore: update dependencies to latest versions",
      "feat: implement dark mode toggle",
      "fix: handle nil pointer in config parser",
      "docs: add API endpoint documentation",
      "test: add integration tests for auth module",
      "perf: optimize database query with index",
      "fix: correct timezone offset calculation",
    ][i % 10],
    author: "Alex Mercer",
    email: "alex@example.com",
    date: new Date(Date.now() - i * 3600000 * 6).toISOString(),
    body:
      i % 3 === 0
        ? "This is an extended commit body with more detail about what changed and why."
        : "",
    selected: false,
  }));

  switch (method) {
    case "ValidateRepo":
      return Promise.resolve(true);
    case "GetRepoInfo":
      return Promise.resolve({
        path: args[0],
        name: "my-awesome-project",
        currentBranch: "feature/auth-refactor",
        totalCommits: 247,
        hasUncommitted: false,
      } as RepoInfo);
    case "GetCommits":
      return Promise.resolve(mockCommits);
    case "GetBranches":
      return Promise.resolve([
        { name: "main", isCurrent: false, isRemote: false },
        { name: "feature/auth-refactor", isCurrent: true, isRemote: false },
        { name: "fix/payment-bug", isCurrent: false, isRemote: false },
      ] as Branch[]);
    case "SquashCommits":
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              success: true,
              newHash: "f3a9b2c",
              message: "Successfully squashed commits",
            } as SquashResult),
          1200,
        ),
      );
    case "OpenFolderDialog":
      return Promise.resolve("/Users/alex/projects/my-awesome-project");
    default:
      return Promise.reject(new Error(`Unknown method: ${method}`));
  }
}

export const wails = {
  validateRepo: (path: string) => wailsCall<boolean>("ValidateRepo", path),
  getRepoInfo: (path: string) => wailsCall<RepoInfo>("GetRepoInfo", path),
  getCommits: (path: string, limit: number) =>
    wailsCall<Commit[]>("GetCommits", path, limit),
  getBranches: (path: string) => wailsCall<Branch[]>("GetBranches", path),
  squashCommits: (req: SquashRequest) =>
    wailsCall<SquashResult>("SquashCommits", req),
  openFolderDialog: () => wailsCall<string>("OpenFolderDialog"),
};
