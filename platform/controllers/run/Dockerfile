FROM python:3.10-slim

#        mkdir ~/.ssh && \
#        ssh-keyscan github.com >> ~/.ssh/known_hosts && \
#        ssh-keyscan github.ibm.com >> ~/.ssh/known_hosts && \


RUN apt update && apt install -y bc build-essential ca-certificates curl git && \
        if [[ $(uname -m) = aarch64 ]]; then ARCH=arm64; else ARCH=amd64; fi && \
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/$ARCH/kubectl" && \
        chmod +x kubectl && \
        mv kubectl /usr/local/bin && \
        curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 && \
        chmod 700 get_helm.sh && \
        ./get_helm.sh && \
        pip install --no-cache-dir kopf kubernetes codeflare-sdk "torchx[dev]==0.5.0" && \
        apt remove -y build-essential ca-certificates curl && \
        rm -rf /var/lib/apt/lists/*

ADD src /src

CMD kopf run /src/handlers.py --verbose
