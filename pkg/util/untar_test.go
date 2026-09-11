package util

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"os"
	"path/filepath"
	"testing"
)

func makeTarGz(t *testing.T, entries map[string]string) *bytes.Buffer {
	t.Helper()
	var buf bytes.Buffer
	gzw := gzip.NewWriter(&buf)
	tw := tar.NewWriter(gzw)
	for name, content := range entries {
		if dir := filepath.Dir(name); dir != "." {
			if err := tw.WriteHeader(&tar.Header{
				Name:     dir + "/",
				Typeflag: tar.TypeDir,
				Mode:     0755,
			}); err != nil {
				t.Fatal(err)
			}
		}
		if err := tw.WriteHeader(&tar.Header{
			Name: name,
			Mode: 0644,
			Size: int64(len(content)),
		}); err != nil {
			t.Fatal(err)
		}
		if _, err := tw.Write([]byte(content)); err != nil {
			t.Fatal(err)
		}
	}
	if err := tw.Close(); err != nil {
		t.Fatal(err)
	}
	if err := gzw.Close(); err != nil {
		t.Fatal(err)
	}
	return &buf
}

func TestUntarRejectsPathTraversal(t *testing.T) {
	dst := t.TempDir()
	archive := makeTarGz(t, map[string]string{"../../evil.txt": "pwned"})

	if err := Untar(dst, archive); err == nil {
		t.Fatal("expected Untar to reject a path-traversal archive entry, got nil error")
	}

	if _, err := os.Stat(filepath.Join(filepath.Dir(filepath.Dir(dst)), "evil.txt")); err == nil {
		t.Fatal("archive entry escaped destination directory")
	}
}

func TestUntarRejectsSiblingWithSharedPrefix(t *testing.T) {
	dst := filepath.Join(t.TempDir(), "out")
	if err := os.MkdirAll(dst, 0755); err != nil {
		t.Fatal(err)
	}
	// an entry name that, when joined naively, produces a sibling
	// directory sharing dst's literal string prefix (e.g. "out" vs
	// "outside") rather than a true subdirectory of dst
	archive := makeTarGz(t, map[string]string{"../outside/evil.txt": "pwned"})

	if err := Untar(dst, archive); err == nil {
		t.Fatal("expected Untar to reject an entry escaping into a sibling directory, got nil error")
	}

	if _, err := os.Stat(filepath.Join(filepath.Dir(dst), "outside")); err == nil {
		t.Fatal("archive entry escaped into a sibling directory")
	}
}

func TestUntarExtractsNormalEntries(t *testing.T) {
	dst := t.TempDir()
	archive := makeTarGz(t, map[string]string{"sub/file.txt": "hello"})

	if err := Untar(dst, archive); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	got, err := os.ReadFile(filepath.Join(dst, "sub", "file.txt"))
	if err != nil {
		t.Fatalf("expected extracted file: %v", err)
	}
	if string(got) != "hello" {
		t.Fatalf("got %q, want %q", got, "hello")
	}
}
