package app

import (
	"Squashly/internal/git"
)

// GetCommits returns a list of commits for the given repository path.
func (a *App) GetCommits(repoPath string, limit int) ([]git.Commit, error) {
	return a.gitSvc.GetCommits(repoPath, limit)
}

// GetBranches returns all local branches for the given repository.
func (a *App) GetBranches(repoPath string) ([]git.Branch, error) {
	return a.gitSvc.GetBranches(repoPath)
}

// GetCurrentBranch returns the current branch name.
func (a *App) GetCurrentBranch(repoPath string) (string, error) {
	return a.gitSvc.GetCurrentBranch(repoPath)
}

// SquashCommits squashes the given commits into one with the provided message.
func (a *App) SquashCommits(req git.SquashRequest) (*git.SquashResult, error) {
	return a.gitSvc.SquashCommits(req)
}

// ValidateRepo checks if the path is a valid git repository.
func (a *App) ValidateRepo(repoPath string) (bool, error) {
	return a.gitSvc.ValidateRepo(repoPath)
}

// GetRepoInfo returns basic info about the repository.
func (a *App) GetRepoInfo(repoPath string) (*git.RepoInfo, error) {
	return a.gitSvc.GetRepoInfo(repoPath)
}

// OpenFolderDialog opens a native folder picker dialog.
func (a *App) OpenFolderDialog() (string, error) {
	return openFolderDialog(a.ctx)
}

// PushForceWithLease pushes the current branch using --force-with-lease.
func (a *App) PushForceWithLease(repoPath string) (*git.PushResult, error) {
	return a.gitSvc.PushForceWithLease(repoPath)
}
