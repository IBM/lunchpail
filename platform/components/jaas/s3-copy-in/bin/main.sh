#!/usr/bin/env bash

if [[ -z "$S3_ENDPOINT" ]]
then
    echo "Missing S3_ENDPOINT"
    exit 1
fi

if [[ -z "$accessKeyID" ]]
then
    echo "Missing accessKeyID"
    exit 1
fi

if [[ -z "$secretAccessKey" ]]
then
    echo "Missing secretAccessKey"
    exit 1
fi

if [[ -z "$COPYIN_ORIGIN" ]]
then
    echo "Missing COPYIN_ORIGIN"
    exit 1
fi

if [[ -z "$COPYIN_REPO" ]]
then
    echo "Missing COPYIN_REPO"
    exit 1
fi

if [[ -z "$COPYIN_BUCKET" ]]
then
    echo "Missing COPYIN_BUCKET"
    exit 1
fi

echo "S3 copy-in endpoint=$S3_ENDPOINT"
echo "S3 copy-in bucket=$COPYIN_BUCKET"
echo "S3 copy-in origin=$COPYIN_ORIGIN"
echo "S3 copy-in repo=$COPYIN_REPO"

until mc alias set s3 $S3_ENDPOINT $accessKeyID $secretAccessKey
do sleep 2
done

mc mb --ignore-existing s3/$COPYIN_BUCKET

if [[ "${COPYIN_ORIGIN}" = git ]]
then
    if [[ -n $COPYIN_user ]]
    then
        PAT_USER=$(echo -n $COPYIN_user | base64 -d)
        PAT=$(echo -n $COPYIN_pat | base64 -d)

        # add user and personal access token
        _COPYIN_URL=$(echo "$COPYIN_REPO" | sed -E "s#(https://)([^/]+)/.+\$#\1$PAT_USER:$PAT@\2#")
    else
        _COPYIN_URL=$(echo "$COPYIN_REPO" | sed -E "s#(https://)([^/]+)/.+\$#\1\2#")
    fi


    _COPYIN_ORG=$(echo "$COPYIN_REPO" | sed -E 's#https://[^/]+/([^/]+)/.+$#\1#')
    _COPYIN_REPO=$(echo "$COPYIN_REPO" | sed -E 's#https://[^/]+/[^/]+/([^/]+)/.+$#\1#')
    _COPYIN_BRANCH=$(echo "$COPYIN_REPO" | sed -E 's#https://[^/]+/[^/]+/[^/]+/tree/([^/]+)/.+$#\1#')
    _COPYIN_SUBDIR=$(echo "$COPYIN_REPO" | sed -E 's#https://[^/]+/[^/]+/[^/]+/tree/[^/]+/(.+)$#\1#')

    _COPYIN_FULL="${_COPYIN_URL}/${_COPYIN_ORG}/${_COPYIN_REPO}.git"

    echo "$(tput setaf 3)[Setup]$(tput sgr0) Cloning repo for s3 copy-in $(tput setaf 6)${_COPYIN_FULL}$(tput sgr0)" 1>&2

    git clone --quiet --no-checkout --filter=blob:none ${_COPYIN_FULL} -b ${_COPYIN_BRANCH} 1>&2
    cd $_COPYIN_REPO

    echo "$(tput setaf 3)[Setup]$(tput sgr0) Sparse checkout for s3 copy-in $(tput setaf 6)branch=${_COPYIN_BRANCH} subdir=${_COPYIN_SUBDIR}$(tput sgr0)" 1>&2
    git sparse-checkout set --cone $_COPYIN_SUBDIR 1>&2
    git checkout -q ${_COPYIN_BRANCH} 1>&2

    cd "${_COPYIN_SUBDIR}"
    echo "Here are the files we will upload:"
    find .

    mc cp -r * s3/$COPYIN_BUCKET
fi
