#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

cd "$SCRIPTDIR"/../../platform/dashboard
yarn install --frozen-lockfile
npm test
