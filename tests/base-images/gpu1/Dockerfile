FROM nvcr.io/nvidia/k8s/cuda-sample:vectoradd-cuda10.2

ENV TZ=America/New_York

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    mv /etc/apt/sources.list.d/* /tmp && \
    apt update && \
    apt -y install python3 python3-pip && \
    pip3 install --no-cache-dir torch>=1.11.0 && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /root/.cache && \
        rm -rf /var/lib/apt/lists/*
