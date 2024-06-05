package shell

import "embed"

//go:generate /bin/sh -c "[ -d ../../../../../charts/shell ] && tar --exclude '*~' --exclude '*README.md' -C ../../../../../charts/shell -zcf shell.tar.gz . || exit 0"
//go:embed shell.tar.gz
var template embed.FS

const templateFile = "shell.tar.gz"
