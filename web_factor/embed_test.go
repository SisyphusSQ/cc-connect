//go:build !no_web

package webfactor

import (
	"bytes"
	"io/fs"
	"testing"

	"github.com/chenhg5/cc-connect/core"
)

func TestEmbeddedFrontendIsFactorBuild(t *testing.T) {
	assets := core.GetWebAssets()
	if assets == nil {
		t.Skip("web_factor production assets have not been built")
	}

	index, err := fs.ReadFile(assets, "index.html")
	if err != nil {
		t.Fatalf("read embedded index: %v", err)
	}
	if !bytes.Contains(index, []byte("CC-Connect Factor")) {
		t.Fatal("embedded index does not identify the Factor frontend")
	}
	if !bytes.Contains(index, []byte("/assets/")) {
		t.Fatal("embedded index does not reference production assets")
	}
}
