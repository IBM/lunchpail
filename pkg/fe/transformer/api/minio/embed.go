package minio

import (
	_ "embed"
)

//go:embed "minio.sh"
var main string
