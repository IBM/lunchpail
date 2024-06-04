#!/usr/bin/env bash

set -eo pipefail

echo "Cloning workdir"
echo "REPO=$REPO"
echo "PAT_USER=$PAT_USER"

set -x

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

# Copy the workdir out of temp. Trailing slashes so we copy the contents of the directory.
cp -a $_WORKDIR_SUBDIR/* $WORKDIR/

echo "Done with clone. Here is what we cloned into workdir:"
find $WORKDIR

# Probably not necessary inside of a container
rm -rf $T
