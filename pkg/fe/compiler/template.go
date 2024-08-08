package compiler

import "embed"

//go:generate /bin/sh -c "[ -d ../../../charts ] && tar --exclude './shell/*' --exclude '*~' --exclude '*README.md' -C ../../../charts -zcf charts.tar.gz . || exit 0"
//go:embed charts.tar.gz
var appTemplate embed.FS
