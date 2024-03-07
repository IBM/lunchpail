#!/usr/bin/env bash

set -e
set -o pipefail

TERM=xterm-256color

NAME="$1"
CUSTOM_WORKING_DIR="$2"
REPO="$3"
PAT_USER_B64="$4"
PAT_B64="$5"

PAT_USER=$(echo -n $PAT_USER_B64 | base64 -d)
PAT=$(echo -n $PAT_B64 | base64 -d)

# add user and personal access token
_WORKDIR_URL=$(echo "$REPO" | sed -E "s#(https://)([^/]+)/.+\$#\1$PAT_USER:$PAT@\2#")

_WORKDIR_ORG=$(echo "$REPO" | sed -E 's#https://[^/]+/([^/]+)/.+$#\1#')
_WORKDIR_REPO=$(echo "$REPO" | sed -E 's#https://[^/]+/[^/]+/([^/]+)/.+$#\1#')
_WORKDIR_BRANCH=$(echo "$REPO" | sed -E 's#https://[^/]+/[^/]+/[^/]+/tree/([^/]+)/.+$#\1#')
_WORKDIR_SUBDIR=$(echo "$REPO" | sed -E 's#https://[^/]+/[^/]+/[^/]+/tree/[^/]+/(.+)$#\1#')

_WORKDIR_FULL="${_WORKDIR_URL}/${_WORKDIR_ORG}/${_WORKDIR_REPO}.git"
# echo "$(tput setaf 3)[Setup]$(tput sgr0) Cloning workdir $(tput setaf 6)${_WORKDIR_FULL}$(tput sgr0)" 1>&2

# avoid git clone symlink issues by cloning to a temp
T=$(mktemp -d)
cd $T

git clone --quiet --no-checkout --filter=blob:none ${_WORKDIR_FULL} -b ${_WORKDIR_BRANCH} 1>&2
cd $_WORKDIR_REPO
git sparse-checkout set --cone $_WORKDIR_SUBDIR 1>&2
git checkout -q ${_WORKDIR_BRANCH} 1>&2

# in some cases (e.g. see
# workdispatcher.py/create_workdispatcher_helm) we don't want to copy
# to s3
if [[ "$CUSTOM_WORKING_DIR" =~ "/tmp" ]]
then PROVIDER=""
else PROVIDER="s3:"
fi

# Copy the workdir out of temp
#mkdir -p "$CUSTOM_WORKING_DIR"/$_WORKDIR_REPO/$_WORKDIR_SUBDIR
cd $_WORKDIR_SUBDIR/..
rclone copy $(basename $_WORKDIR_SUBDIR) $PROVIDER"$CUSTOM_WORKING_DIR"/$_WORKDIR_REPO/$(dirname $_WORKDIR_SUBDIR)/$(basename $_WORKDIR_SUBDIR)
rm -rf $T

echo -n "${_WORKDIR_REPO}/${_WORKDIR_SUBDIR}"
