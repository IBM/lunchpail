package queue

import "strings"

func Name(runname string) string {
	return strings.Replace(runname, "-", "", -1) + "queue"
}
