package app

import (
	"Squashly/internal/git"
	"context"
)

// App is the main application struct exposed to the frontend via Wails bindings.
type App struct {
	ctx    context.Context
	gitSvc *git.Service
}

// New creates a new App instance.
func New() *App {
	return &App{
		gitSvc: git.NewService(),
	}
}

// Startup is called when the app starts. The context is saved for use in runtime calls.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// Shutdown is called when the app is about to quit.
func (a *App) Shutdown(ctx context.Context) {}
