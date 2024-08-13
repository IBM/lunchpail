package minio

import "embed"

//go:generate /bin/sh -c "[ -d ../../../../../charts/minio ] && tar --exclude '*~' --exclude '*README.md' -C ../../../../../charts/minio -zcf minio.tar.gz . || exit 0"
//go:embed minio.tar.gz
var template embed.FS

const templateFile = "minio.tar.gz"
