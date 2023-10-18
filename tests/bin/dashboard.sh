#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

cd "$SCRIPTDIR"/../../platform/dashboard
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
yarn install --frozen-lockfile
yarn test
yarn build:$(uname)
yarn playwright test