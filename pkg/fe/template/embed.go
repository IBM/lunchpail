package template

import "embed"

//go:generate /bin/sh -c "[ ! -e ./chart.tar.gz ] || [ ./chart/templates -nt ./chart.tar.gz ] && tar --exclude '*~' --exclude '*README.md' -C ./chart -zcf chart.tar.gz . || exit 0"
//go:embed chart.tar.gz
var appTemplate embed.FS

const appTemplateFile = "chart.tar.gz"

// NOTE: keep this in sync with ... this directory and appTemplateFile
const embededTemplatePath = "pkg/fe/template/chart.tar.gz"
