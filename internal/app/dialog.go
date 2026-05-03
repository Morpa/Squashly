package app

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func openFolderDialog(ctx context.Context) (string, error) {
	path, err := runtime.OpenDirectoryDialog(ctx, runtime.OpenDialogOptions{
		Title: "Select Git Repository",
	})
	if err != nil {
		return "", err
	}
	return path, nil
}
