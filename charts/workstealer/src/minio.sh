#!/usr/bin/env bash

DATA_DIR=./data

export MINIO_ROOT_USER=$INTERNAL_S3_ACCESS_KEY
export MINIO_ROOT_PASSWORD=$INTERNAL_S3_SECRET_KEY

if [[ ! -d $DATA_DIR ]]
then mkdir $DATA_DIR
fi

echo "Starting minio"
minio server $DATA_DIR
