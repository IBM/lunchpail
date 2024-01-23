FROM python:3.10-alpine

RUN apk update && apk add --no-cache bc ca-certificates curl git bash && \
        if [ $(uname -m) = aarch64 ]; then ARCH=arm64; else ARCH=amd64; fi && \
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/$ARCH/kubectl" && \
        chmod +x kubectl && \
        mv kubectl /usr/local/bin && \
        curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 && \
        chmod 700 get_helm.sh && \
        VERIFY_CHECKSUM=false ./get_helm.sh && \
        rm ./get_helm.sh && \
        pip install --no-cache-dir kopf>=1.37 kubernetes>=21 && \
        pip uninstall -y pip
