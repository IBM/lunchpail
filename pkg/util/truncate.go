package util

// truncate `str` to have at most `max` length
func Truncate(str string, max int) string {
	if len(str) > max {
		return str[:max]
	} else {
		return str
	}
}

// End-elide a given string, if needed
func ElideEnd(s string, maxlen int) string {
	if len(s) <= maxlen {
		return s
	}
	// middle ellipsis: return s[:maxlen/2-1] + "…" + s[len(s)-maxlen/2:]
	return s[:maxlen-1] + "…"
}
