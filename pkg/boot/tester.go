//go:build full || manage

package boot

import (
	"bytes"
	"compress/gzip"
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"slices"

	"github.com/dustin/go-humanize/english"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/hlir"
)

type Tester struct {
	Quiet bool
	be.Backend
	build.Options
}

func (t Tester) RunAll(ctx context.Context) error {
	testData, stageDir, err := build.TestDataWithStage()
	if err != nil {
		return err
	}
	if !t.Options.Verbose() {
		defer os.RemoveAll(stageDir)
	}

	inputs, expected, err := t.prepareInputs(testData, stageDir)
	if err != nil {
		return err
	} else if len(inputs) == 0 {
		return fmt.Errorf("This application provided no test input")
	}

	return t.Run(ctx, inputs, expected)
}

func (t Tester) prepareInputs(testData hlir.TestData, stageDir string) (inputs []string, outputs []string, err error) {
	inputDir := build.TestDataDirForInput(stageDir)
	expectedDir := build.TestDataDirForExpected(stageDir)
	for _, test := range testData {
		inputs = append(inputs, filepath.Join(inputDir, test.Input))

		for _, expected := range test.Expected {
			outputs = append(outputs, filepath.Join(expectedDir, expected))
		}
	}

	if t.Options.Verbose() {
		fmt.Fprintln(os.Stderr, "Test data staged to", inputDir)
	}

	return
}

func (t Tester) Run(ctx context.Context, inputs []string, expected []string) error {
	fmt.Fprintf(os.Stderr, "Testing %s\n", english.Plural(len(inputs), "input", ""))

	if slices.IndexFunc(inputs, func(input string) bool { return filepath.Ext(input) == ".gz" }) >= 0 {
		t.Options.Gunzip = true
	}

	redirectTo, err := ioutil.TempDir("", build.Name()+"-test-output")
	if err != nil {
		return err
	}
	if !t.Options.Verbose() {
		defer os.RemoveAll(redirectTo)
	}

	if runContext, err := Up(ctx, t.Backend, UpOptions{Inputs: inputs, BuildOptions: t.Options, RedirectTo: redirectTo, Watch: !t.Quiet}); err != nil {
		return err
	} else if err := Down(ctx, runContext.Run.RunName, t.Backend, DownOptions{Namespace: t.Options.Target.Namespace, Verbose: t.Options.Verbose()}); err != nil {
		return err
	}

	if err := t.validate(inputs, expected, redirectTo); err != nil {
		fmt.Fprintln(os.Stderr, "❌ FAIL", build.Name(), err)
		return err
	}

	fmt.Fprintln(os.Stderr, "✅ PASS", build.Name())
	return nil
}

func (t Tester) validate(inputs []string, expecteds []string, redirectTo string) error {
	if len(expecteds) == 0 {
		// Nothing to validate
		if t.Options.Verbose() {
			fmt.Fprintln(os.Stderr, "Skipping validation, as no expected output was provided for", build.Name())
		}
		return nil
	}

	if t.Options.Verbose() {
		fmt.Fprintf(os.Stderr, "Validating output for %s in redirect directory %s\n", build.Name(), redirectTo)
	}

	actuals, err := os.ReadDir(redirectTo)
	if err != nil {
		return err
	}

	found := 0
	for _, expected := range expecteds {
		expectedFileName := filepath.Base(expected)

		// TODO O(N^2)
		for _, actual := range actuals {
			matches := actual.Name() == expectedFileName
			matchesWithGunzip := !matches && actual.Name()+".gz" == expectedFileName
			if matches || matchesWithGunzip {
				found++

				actualBytes, err := os.ReadFile(filepath.Join(redirectTo, actual.Name()))
				if err != nil {
					return err
				}

				expectedBytes, err := os.ReadFile(expected)
				if err != nil {
					return err
				}

				if ok, err := t.equal(matchesWithGunzip, expectedBytes, actualBytes); err != nil {
					return err
				} else if !ok {
					return fmt.Errorf("actual!=expected for %s", expectedFileName)
				}
			}
		}
	}

	if found != len(expecteds) {
		return fmt.Errorf("Missing output files. Expected %d got %d.", len(expecteds), found)
	}

	return nil
}

func (t Tester) equal(needsGunzip bool, expected, actual []byte) (bool, error) {
	if needsGunzip {
		reader, err := gzip.NewReader(bytes.NewReader(expected))
		if err != nil {
			return false, err
		}
		defer reader.Close()

		expected, err = ioutil.ReadAll(reader)
		if err != nil {
			return false, err
		}
	}

	return bytes.Equal(expected, actual), nil
}
