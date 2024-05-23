package util

// truncate `str` to have at most `max` length
func Truncate(str string, max int) string {
	if len(str) > max {
		return str[:max]
	} else {
		return str
	}
}
