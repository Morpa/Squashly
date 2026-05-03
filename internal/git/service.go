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

func NewService() *Service { return &Service{} }

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

	return &RepoInfo{
		Path:           repoPath,
		Name:           filepath.Base(repoPath),
		CurrentBranch:  branch,
		TotalCommits:   count,
		HasUncommitted: strings.TrimSpace(statusOut) != "",
	}, nil
}

// GetCurrentBranch returns the current branch name.
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

// GetCommits returns commits for the current branch.
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
	for _, entry := range strings.Split(out, "---END---") {
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

// SquashCommits squashes N commits into one.
func (s *Service) SquashCommits(req SquashRequest) (*SquashResult, error) {
	n := len(req.CommitHashes)
	if n < 2 {
		return nil, errors.New("select at least 2 commits to squash")
	}

	statusOut, _ := s.run(req.RepoPath, "status", "--porcelain")
	if strings.TrimSpace(statusOut) != "" {
		return nil, errors.New("repo has uncommitted changes")
	}

	logOut, err := s.run(req.RepoPath, "log",
		fmt.Sprintf("-n%d", n),
		"--pretty=format:%H",
	)
	if err != nil {
		return nil, err
	}

	topHashes := strings.Fields(strings.TrimSpace(logOut))
	selected := make(map[string]bool)

	for _, h := range req.CommitHashes {
		selected[h] = true
	}

	for _, h := range topHashes {
		if !selected[h] {
			return nil, errors.New("selected commits must be contiguous from HEAD")
		}
	}

	if _, err := s.run(req.RepoPath, "reset", "--soft",
		fmt.Sprintf("HEAD~%d", n)); err != nil {
		return nil, err
	}

	msg := req.Message
	if req.Body != "" {
		msg += "\n\n" + req.Body
	}

	if _, err := s.run(req.RepoPath, "commit", "-m", msg); err != nil {
		_, _ = s.run(req.RepoPath, "reset", "--soft", "HEAD@{1}")
		return nil, err
	}

	newHash, _ := s.run(req.RepoPath, "rev-parse", "--short", "HEAD")

	return &SquashResult{
		Success: true,
		NewHash: strings.TrimSpace(newHash),
	}, nil
}

// PushForceWithLease
func (s *Service) PushForceWithLease(repoPath string) (*PushResult, error) {
	branch, err := s.GetCurrentBranch(repoPath)
	if err != nil {
		return nil, err
	}

	remote := "origin"

	// 🔥 1. Sempre sincroniza refs remotas (boa prática)
	if _, err := s.run(repoPath, "fetch", remote, branch); err != nil {
		return nil, fmt.Errorf("fetch failed: %w", err)
	}

	// 🔍 2. Detecta estado
	out, err := s.run(repoPath, "rev-list", "--left-right", "--count",
		fmt.Sprintf("HEAD...%s/%s", remote, branch))
	if err != nil {
		return nil, fmt.Errorf("checking status: %w", err)
	}

	parts := strings.Fields(out)
	if len(parts) != 2 {
		return nil, fmt.Errorf("unexpected rev-list output: %s", out)
	}

	ahead, _ := strconv.Atoi(parts[0])
	behind, _ := strconv.Atoi(parts[1])

	out, err = s.exec(repoPath, true, "push", "--force-with-lease", remote, branch)
	if err != nil {
		return nil, fmt.Errorf("push failed: %s", out)
	}

	return &PushResult{
		Success: true,
		Message: fmt.Sprintf("Push OK (force-with-lease) — ahead:%d, behind:%d", ahead, behind),
	}, nil
}

// exec runs a git command. If combined is true, stdout and stderr are merged.
func (s *Service) exec(dir string, combined bool, args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = dir

	if combined {
		out, err := cmd.CombinedOutput()
		res := strings.TrimSpace(string(out))
		if err != nil {
			return res, errors.New(res)
		}
		return res, nil
	}

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		return "", errors.New(msg)
	}
	return stdout.String(), nil
}

// run is a shorthand for exec without combined output.
func (s *Service) run(dir string, args ...string) (string, error) {
	return s.exec(dir, false, args...)
}
