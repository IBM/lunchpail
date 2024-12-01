package hlir

type TestDatum struct {
	Name  string
	Input string

	// Each Input may provide 0 or more Expected outputs, hence the array
	Expected []string
}

type TestData = []TestDatum
