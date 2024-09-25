package builder

func supportedOs() []string {
	return []string{
		"darwin",
		"linux",
	}
}

func supportedArch() []string {
	return []string{
		"amd64",
		"arm64",
	}
}
