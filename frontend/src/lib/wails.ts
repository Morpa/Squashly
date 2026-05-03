// Types mirroring Go structs
export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  email: string;
  date: string;
  body: string;
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

export interface PushResult {
  success: boolean;
  remote: string;
  branch: string;
  message: string;
  errorMsg?: string;
}

// ---------------------------------------------------------------------------
// Wails runtime bridge
//
// Wails injects `window.go.app.App` at runtime with all bound methods.
// We check for each method individually so that if a new method was added
// but the app hasn't been rebuilt yet, it falls through to the mock
// instead of throwing "is not a function".
// ---------------------------------------------------------------------------

function getWailsMethod(
  method: string,
): ((...args: unknown[]) => Promise<unknown>) | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (window as any)?.go?.app?.App?.[method];
    if (typeof fn === "function") return fn;
  } catch {
    // not running inside Wails
  }
  return null;
}

function wailsCall<T>(method: string, ...args: unknown[]): Promise<T> {
  const fn = getWailsMethod(method);
  if (fn) return fn(...args) as Promise<T>;
  return mockApi(method, ...args) as Promise<T>;
}

// ---------------------------------------------------------------------------
// Dev mock — used in the browser when wailsjs bindings are not available
// ---------------------------------------------------------------------------
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
    body: i % 3 === 0 ? "Extended commit body with more detail." : "",
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
      ] as Branch[]);
    case "SquashCommits":
      return new Promise((r) =>
        setTimeout(
          () =>
            r({
              success: true,
              newHash: "f3a9b2c",
              message: "Squashed 2 commits → f3a9b2c",
            } as SquashResult),
          1000,
        ),
      );
    case "PushForceWithLease":
      return new Promise((r) =>
        setTimeout(
          () =>
            r({
              success: true,
              remote: "origin",
              branch: "feature/auth-refactor",
              message:
                "Force-pushed feature/auth-refactor → origin/feature/auth-refactor",
            } as PushResult),
          800,
        ),
      );
    case "OpenFolderDialog":
      return Promise.resolve("/Users/alex/projects/my-awesome-project");
    default:
      return Promise.reject(new Error(`Unknown mock method: ${method}`));
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const wails = {
  validateRepo: (path: string) => wailsCall<boolean>("ValidateRepo", path),
  getRepoInfo: (path: string) => wailsCall<RepoInfo>("GetRepoInfo", path),
  getCommits: (path: string, n: number) =>
    wailsCall<Commit[]>("GetCommits", path, n),
  getBranches: (path: string) => wailsCall<Branch[]>("GetBranches", path),
  squashCommits: (req: SquashRequest) =>
    wailsCall<SquashResult>("SquashCommits", req),
  pushForceWithLease: (path: string) =>
    wailsCall<PushResult>("PushForceWithLease", path),
  openFolderDialog: () => wailsCall<string>("OpenFolderDialog"),
};
