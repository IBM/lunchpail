package workerpool

import "embed"

//go:generate /bin/sh -c "[ -d ../../../../../charts/workerpool ] && tar --exclude '*~' --exclude '*README.md' -C ../../../../../charts/workerpool -zcf workerpool.tar.gz . || exit 0"
//go:embed workerpool.tar.gz
var template embed.FS

const templateFile = "workerpool.tar.gz"
