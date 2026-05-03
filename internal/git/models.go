package git

import "time"

// Commit represents a single git commit.
type Commit struct {
	Hash      string    `json:"hash"`
	ShortHash string    `json:"shortHash"`
	Message   string    `json:"message"`
	Author    string    `json:"author"`
	Email     string    `json:"email"`
	Date      time.Time `json:"date"`
	Body      string    `json:"body"`
}

// Branch represents a git branch.
type Branch struct {
	Name      string `json:"name"`
	IsCurrent bool   `json:"isCurrent"`
	IsRemote  bool   `json:"isRemote"`
}

// RepoInfo contains metadata about a git repository.
type RepoInfo struct {
	Path           string `json:"path"`
	Name           string `json:"name"`
	CurrentBranch  string `json:"currentBranch"`
	TotalCommits   int    `json:"totalCommits"`
	HasUncommitted bool   `json:"hasUncommitted"` // fixed: was HasUncommited (typo)
}

// SquashRequest is the payload sent from the frontend to squash commits.
// CommitHashes are in log order (newest first). The service uses len() for
// HEAD~N and validates contiguity — no need to sort on the frontend.
type SquashRequest struct {
	RepoPath     string   `json:"repoPath"`
	CommitHashes []string `json:"commitHashes"`
	Message      string   `json:"message"`
	Body         string   `json:"body"`
}

// SquashResult is the result of a squash operation.
type SquashResult struct {
	Success  bool   `json:"success"`
	NewHash  string `json:"newHash"`
	Message  string `json:"message"`
	ErrorMsg string `json:"errorMsg,omitempty"`
}

// PushResult is the result of a push --force-with-lease operation.
type PushResult struct {
	Success  bool   `json:"success"`
	Remote   string `json:"remote"`
	Branch   string `json:"branch"`
	Message  string `json:"message"`
	ErrorMsg string `json:"errorMsg,omitempty"`
}
