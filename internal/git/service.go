package git

import (
	"bytes"
	"errors"
	"fmt"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// Service handles all git operations.
type Service struct{}

// NewService creates a new Git Service.
func NewService() *Service {
	return &Service{}
}

// ValidateRepo checks whether the given path is a valid git repository.
func (s *Service) ValidateRepo(repoPath string) (bool, error) {
	if repoPath == "" {
		return false, nil
	}
	out, err := s.run(repoPath, "rev-parse", "--is-inside-work-tree")
	if err != nil {
		return false, nil
	}
	return strings.TrimSpace(out) == "true", nil
}

// GetRepoInfo returns metadata for the repository.
func (s *Service) GetRepoInfo(repoPath string) (*RepoInfo, error) {
	branch, err := s.GetCurrentBranch(repoPath)
	if err != nil {
		return nil, err
	}

	countOut, err := s.run(repoPath, "rev-list", "--count", "HEAD")
	if err != nil {
		return nil, fmt.Errorf("counting commits: %w", err)
	}
	count, _ := strconv.Atoi(strings.TrimSpace(countOut))

	statusOut, _ := s.run(repoPath, "status", "--porcelain")
	hasUncommitted := strings.TrimSpace(statusOut) != ""

	return &RepoInfo{
		Path:          repoPath,
		Name:          filepath.Base(repoPath),
		CurrentBranch: branch,
		TotalCommits:  count,
		HasUncommited: hasUncommitted,
	}, nil
}

// GetCurrentBranch returns the name of the currently checked-out branch.
func (s *Service) GetCurrentBranch(repoPath string) (string, error) {
	out, err := s.run(repoPath, "rev-parse", "--abbrev-ref", "HEAD")
	if err != nil {
		return "", fmt.Errorf("getting current branch: %w", err)
	}
	return strings.TrimSpace(out), nil
}

// GetBranches returns all local branches.
func (s *Service) GetBranches(repoPath string) ([]Branch, error) {
	current, err := s.GetCurrentBranch(repoPath)
	if err != nil {
		return nil, err
	}

	out, err := s.run(repoPath, "branch", "--format=%(refname:short)")
	if err != nil {
		return nil, fmt.Errorf("listing branches: %w", err)
	}

	var branches []Branch
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		name := strings.TrimSpace(line)
		if name == "" {
			continue
		}
		branches = append(branches, Branch{
			Name:      name,
			IsCurrent: name == current,
		})
	}
	return branches, nil
}

// GetCommits returns a list of commits for the current branch.
func (s *Service) GetCommits(repoPath string, limit int) ([]Commit, error) {
	if limit <= 0 {
		limit = 50
	}

	sep := "|||"
	format := fmt.Sprintf("%%H%s%%h%s%%s%s%%an%s%%ae%s%%aI%s%%b%s---END---", sep, sep, sep, sep, sep, sep, sep)

	out, err := s.run(repoPath, "log",
		fmt.Sprintf("-n%d", limit),
		fmt.Sprintf("--pretty=format:%s", format),
	)
	if err != nil {
		return nil, fmt.Errorf("getting commits: %w", err)
	}

	var commits []Commit
	entries := strings.Split(out, "---END---")
	for _, entry := range entries {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		parts := strings.Split(entry, sep)
		if len(parts) < 7 {
			continue
		}

		t, _ := time.Parse(time.RFC3339, strings.TrimSpace(parts[5]))
		commits = append(commits, Commit{
			Hash:      strings.TrimSpace(parts[0]),
			ShortHash: strings.TrimSpace(parts[1]),
			Message:   strings.TrimSpace(parts[2]),
			Author:    strings.TrimSpace(parts[3]),
			Email:     strings.TrimSpace(parts[4]),
			Date:      t,
			Body:      strings.TrimSpace(parts[6]),
		})
	}
	return commits, nil
}

// SquashCommits performs the squash operation using git rebase.
// It squashes the selected commits (oldest→newest) into a single commit.
func (s *Service) SquashCommits(req SquashRequest) (*SquashResult, error) {
	if len(req.CommitHashes) < 2 {
		return nil, errors.New("need at least 2 commits to squash")
	}

	// Find the parent of the oldest commit (last in the slice since log is newest-first)
	oldestHash := req.CommitHashes[len(req.CommitHashes)-1]

	parentOut, err := s.run(req.RepoPath, "rev-parse", oldestHash+"^")
	if err != nil {
		return nil, fmt.Errorf("finding parent commit: %w", err)
	}
	parentHash := strings.TrimSpace(parentOut)

	// Use soft reset to the parent, then create a new commit
	if _, err := s.run(req.RepoPath, "reset", "--soft", parentHash); err != nil {
		return nil, fmt.Errorf("resetting to parent: %w", err)
	}

	commitMsg := req.Message
	if req.Body != "" {
		commitMsg = req.Message + "\n\n" + req.Body
	}

	if _, err := s.run(req.RepoPath, "commit", "-m", commitMsg); err != nil {
		return nil, fmt.Errorf("creating squashed commit: %w", err)
	}

	newHashOut, err := s.run(req.RepoPath, "rev-parse", "--short", "HEAD")
	if err != nil {
		return nil, fmt.Errorf("getting new commit hash: %w", err)
	}

	return &SquashResult{
		Success: true,
		NewHash: strings.TrimSpace(newHashOut),
		Message: fmt.Sprintf("Successfully squashed %d commits into %s", len(req.CommitHashes), strings.TrimSpace(newHashOut)),
	}, nil
}

// run executes a git command in the given directory and returns stdout.
func (s *Service) run(dir string, args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = dir

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("%w: %s", err, stderr.String())
	}
	return stdout.String(), nil
}
