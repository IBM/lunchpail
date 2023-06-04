#!/usr/bin/env bash

TERM=xterm-256color

NAME="$1"
CUSTOM_WORKING_DIR="$2"
REPO="$3"
PAT_USER_B64="$4"
PAT_B64="$5"

#CUSTOM_WORKING_DIR=$(mktemp -d $WORKDIR/$NAME-XXXXXXXXXXX)
mkdir "$CUSTOM_WORKING_DIR"
cd "$CUSTOM_WORKING_DIR"

PAT_USER=$(echo -n $PAT_USER_B64 | base64 -d)
PAT=$(echo -n $PAT_B64 | base64 -d)

# add user and personal access token
_WORKDIR_URL=$(echo "$REPO" | sed -E "s#(https://)([^/]+)/.+\$#\1$PAT_USER:$PAT@\2#")

_WORKDIR_ORG=$(echo "$REPO" | sed -E 's#https://[^/]+/([^/]+)/.+$#\1#')
_WORKDIR_REPO=$(echo "$REPO" | sed -E 's#https://[^/]+/[^/]+/([^/]+)/.+$#\1#')
_WORKDIR_BRANCH=$(echo "$REPO" | sed -E 's#https://[^/]+/[^/]+/[^/]+/tree/([^/]+)/.+$#\1#')
_WORKDIR_SUBDIR=$(echo "$REPO" | sed -E 's#https://[^/]+/[^/]+/[^/]+/tree/[^/]+/(.+)$#\1#')

_WORKDIR_FULL="${_WORKDIR_URL}/${_WORKDIR_ORG}/${_WORKDIR_REPO}.git"
# echo "$(tput setaf 3)[Setup]$(tput sgr0) Cloning workdir $(tput setaf 6)${_WORKDIR_FULL}$(tput sgr0)" 2>&1

(git clone --quiet --no-checkout --filter=blob:none ${_WORKDIR_FULL} -b ${_WORKDIR_BRANCH} > /dev/null && \
     cd $_WORKDIR_REPO && \
     git sparse-checkout set --cone $_WORKDIR_SUBDIR > /dev/null && git checkout -q ${_WORKDIR_BRANCH} > /dev/null)
if [[ $? != 0 ]]; then exit $?; fi

echo -n "${_WORKDIR_REPO}/${_WORKDIR_SUBDIR}"
