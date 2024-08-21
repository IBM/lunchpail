package compilation

import "embed"

//go:generate /bin/sh -c "[ ! -e ./app.tar.gz ] && tar -zcf app.tar.gz -T /dev/null || exit 0"
//go:embed app.tar.gz
var appTemplate embed.FS

const appTemplateFile = "app.tar.gz"

// NOTE: keep this in sync with ... this directory and appTemplateFile
const embededTemplatePath = "pkg/compilation/app.tar.gz"


