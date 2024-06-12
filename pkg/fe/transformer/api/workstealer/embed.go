package workstealer

import "embed"

//go:generate /bin/sh -c "[ -d ../../../../../charts/workstealer ] && tar --exclude '*~' --exclude '*README.md' -C ../../../../../charts/workstealer -zcf workstealer.tar.gz . || exit 0"
//go:embed workstealer.tar.gz
var template embed.FS

const templateFile = "workstealer.tar.gz"
