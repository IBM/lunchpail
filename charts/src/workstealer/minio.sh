#!/usr/bin/env bash

DATA_DIR=./data

export MINIO_ROOT_USER=${!AWS_ACCESS_KEY_ID_VAR}
export MINIO_ROOT_PASSWORD=${!AWS_SECRET_ACCESS_KEY_VAR}

if [[ ! -d $DATA_DIR ]]
then mkdir $DATA_DIR
fi

echo "Starting minio"
minio server $DATA_DIR
