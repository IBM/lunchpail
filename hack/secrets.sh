#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/my.secrets.sh

HELM_SECRETS="--set codeflare-ibm-internal.github_ibm_com.secret.user=$AI_FOUNDATION_GITHUB_USER --set codeflare-ibm-internal.github_ibm_com.secret.pat=$AI_FOUNDATION_GITHUB_PAT"
