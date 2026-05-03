import { useState, useCallback, useRef } from "react";
import {
  wails,
  type Commit,
  type RepoInfo,
  type SquashResult,
  type PushResult,
} from "@/lib/wails";

export type AppView = "welcome" | "main";
export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export function useAppStore() {
  const [view, setView] = useState<AppView>("welcome");
  const [repoPath, setRepoPath] = useState("");
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedHashes, setSelectedHashes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [squashing, setSquashing] = useState(false);
  const [squashResult, setSquashResult] = useState<SquashResult | null>(null);
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [pushing, setPushing] = useState(false);
  const [commitLimit, setCommitLimitState] = useState(30);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Refs prevent stale closures in async callbacks
  const repoPathRef = useRef("");
  const commitLimitRef = useRef(30);
  const commitsRef = useRef<Commit[]>([]);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000,
      );
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Core fetch — always reads from refs so never stale
  const fetchCommits = useCallback(async (path: string, limit: number) => {
    const cmts = await wails.getCommits(path, limit);
    commitsRef.current = cmts;
    setCommits(cmts);
    setSelectedHashes(new Set());
  }, []);

  const loadRepo = useCallback(
    async (path: string) => {
      setLoading(true);
      try {
        const valid = await wails.validateRepo(path);
        if (!valid) {
          addToast(
            "error",
            "Invalid repository",
            "The selected folder is not a git repository.",
          );
          return;
        }
        const [info, cmts] = await Promise.all([
          wails.getRepoInfo(path),
          wails.getCommits(path, commitLimitRef.current),
        ]);
        repoPathRef.current = path;
        commitsRef.current = cmts;
        setRepoPath(path);
        setRepoInfo(info);
        setCommits(cmts);
        setSelectedHashes(new Set());
        setSquashResult(null);
        setView("main");
      } catch (e) {
        addToast("error", "Failed to load repository", String(e));
      } finally {
        setLoading(false);
      }
    },
    [addToast],
  );

  const refreshCommits = useCallback(async () => {
    if (!repoPathRef.current) return;
    setLoading(true);
    try {
      await fetchCommits(repoPathRef.current, commitLimitRef.current);
    } catch (e) {
      addToast("error", "Failed to refresh", String(e));
    } finally {
      setLoading(false);
    }
  }, [addToast, fetchCommits]);

  // Update limit AND immediately refetch with the new value (no stale closure)
  const setCommitLimit = useCallback(
    (n: number) => {
      commitLimitRef.current = n;
      setCommitLimitState(n);
      if (!repoPathRef.current) return;
      setLoading(true);
      fetchCommits(repoPathRef.current, n)
        .catch((e) => addToast("error", "Failed to refresh", String(e)))
        .finally(() => setLoading(false));
    },
    [addToast, fetchCommits],
  );

  const openFolder = useCallback(async () => {
    const path = await wails.openFolderDialog();
    if (path) await loadRepo(path);
  }, [loadRepo]);

  // Toggle a commit and auto-fill any gaps so the selection is always
  // a contiguous block — required by git reset --soft HEAD~N.
  // Uses commitsRef to read current commits without stale closures.
  const toggleCommit = useCallback((hash: string) => {
    setSelectedHashes((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) {
        next.delete(hash);
      } else {
        next.add(hash);
      }

      // Fill gaps between min and max selected index
      if (next.size >= 2) {
        const currentCommits = commitsRef.current;
        const indices = currentCommits
          .map((c, i) => (next.has(c.hash) ? i : -1))
          .filter((i) => i !== -1);
        const minIdx = Math.min(...indices);
        const maxIdx = Math.max(...indices);
        for (let i = minIdx; i <= maxIdx; i++) {
          next.add(currentCommits[i].hash);
        }
      }

      return next;
    });
  }, []);

  // Shift+click range select
  const selectRange = useCallback((startIdx: number, endIdx: number) => {
    const currentCommits = commitsRef.current;
    const [from, to] =
      startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    setSelectedHashes(
      new Set(currentCommits.slice(from, to + 1).map((c) => c.hash)),
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedHashes(new Set()), []);

  const squash = useCallback(
    async (message: string, body: string) => {
      // Snapshot current state synchronously before any async work
      let ordered: string[] = [];
      let hasEnough = false;

      setCommits((currentCommits) => {
        setSelectedHashes((currentSelected) => {
          if (currentSelected.size >= 2) {
            hasEnough = true;
            // Preserve log order (newest-first); service uses reset --soft on the oldest
            ordered = currentCommits
              .filter((c) => currentSelected.has(c.hash))
              .map((c) => c.hash);
          }
          return currentSelected;
        });
        return currentCommits;
      });

      if (!hasEnough) return;

      const path = repoPathRef.current;
      const limit = commitLimitRef.current;

      setSquashing(true);
      setSquashResult(null);
      try {
        const result = await wails.squashCommits({
          repoPath: path,
          commitHashes: ordered,
          message,
          body,
        });
        setSquashResult(result);
        if (result.success) {
          addToast("success", "Squash complete!", result.message);
          setLoading(true);
          await fetchCommits(path, limit);
        } else {
          addToast(
            "error",
            "Squash failed",
            result.errorMsg ?? "Unknown error",
          );
        }
      } catch (e) {
        addToast("error", "Squash failed", String(e));
      } finally {
        setSquashing(false);
        setLoading(false);
      }
    },
    [addToast, fetchCommits],
  );

  const push = useCallback(async () => {
    const path = repoPathRef.current;
    if (!path) return;
    setPushing(true);
    setPushResult(null);
    try {
      const result = await wails.pushForceWithLease(path);
      setPushResult(result);
      if (result.success) {
        addToast("success", "Push complete!", result.message);
      } else {
        addToast("error", "Push failed", result.errorMsg ?? "Unknown error");
      }
    } catch (e) {
      addToast("error", "Push failed", String(e));
    } finally {
      setPushing(false);
    }
  }, [addToast]);

  // Reset everything after a squash+push cycle so the user can start fresh
  const resetSquash = useCallback(() => {
    setSquashResult(null);
    setPushResult(null);
    setSelectedHashes(new Set());
  }, []);

  const selectedCommits = commits.filter((c) => selectedHashes.has(c.hash));

  return {
    view,
    repoPath,
    repoInfo,
    commits,
    selectedHashes,
    selectedCommits,
    loading,
    squashing,
    squashResult,
    pushing,
    pushResult,
    commitLimit,
    toasts,
    setCommitLimit,
    loadRepo,
    openFolder,
    refreshCommits,
    toggleCommit,
    selectRange,
    clearSelection,
    squash,
    push,
    resetSquash,
    addToast,
    removeToast,
    setView,
  };
}
