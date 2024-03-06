#!/usr/bin/env bash

function get_minio_client {
    if ! which mc >& /dev/null; then
        echo "$(tput setaf 2)Installing minio client$(tput sgr0)"

        if [[ $(uname) = "Darwin" ]]
        then
            brew install minio/stable/minio
        elif [[ $(uname) = "Linux" ]]
        then
            if [[ $(uname -m) = "aarch64" ]]
            then
                local mc_arch=arm64
            else
                local mc_arch=amd64
            fi
            curl https://dl.min.io/client/mc/release/linux-${mc_arch}/mc \
                 --create-dirs \
                 -o mc

            chmod +x mc
            sudo mv mc /usr/local/bin
        else
            echo "Platform not supported for minio client: $(uname)"
            exit 1
        fi
    fi
}

get_minio_client
