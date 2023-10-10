FROM python:3.10-slim

ENV TORCHX_HOME=/usr/local/torchx

RUN apt update && apt install -y bc build-essential ca-certificates curl git && \
        if [ $(uname -m) = aarch64 ]; then ARCH=arm64; else ARCH=amd64; fi && \
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/$ARCH/kubectl" && \
        chmod +x kubectl && \
        mv kubectl /usr/local/bin && \
        curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 && \
        chmod 700 get_helm.sh && \
        ./get_helm.sh && \
        rm ./get_helm.sh && \
        pip install --no-cache-dir kopf kubernetes>=21 && \
        python -m pip install --upgrade pip && \
        python -m venv $TORCHX_HOME && $TORCHX_HOME/bin/pip install --no-cache-dir 'torchx==0.5.0' 'kubernetes==18.20.0' && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/ts && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/ray && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/moto && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/numpy && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/scipy && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/scipy.libs && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/numpy.libs && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/sympy && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/mlflow && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/nvidia && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/pandas && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/plotly && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/sklearn && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/botocore && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/fontTools && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/matplotlib && \
        rm -rf $TORCHX_HOME/lib/python*/site-packages/sqlalchemy && \
        rm -f $TORCHX_HOME/lib/python*/site-packages/torch/_torch_docs.py && \
        rm -f $TORCHX_HOME/lib/python*/site-packages/torch/_tensor_docs.py && \
        apt remove -y build-essential ca-certificates curl && \
        apt autoremove -y && \
        rm -rf /var/lib/apt/lists/*
