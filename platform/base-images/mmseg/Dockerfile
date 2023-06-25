FROM ghcr.io/project-codeflare/lightning:0.0.5

ENV \
    DEBIAN_FRONTEND="noninteractive" \
    CONDA_ENV="lightning" \
    PATH="/root/miniconda3/bin:$PATH" \
    LD_LIBRARY_PATH="/root/miniconda3/lib:$LD_LIBRARY_PATH"

COPY requirements.txt /tmp/requirements.txt

WORKDIR /mmsegmentation

RUN unset LD_LIBRARY_PATH && \
    apt-get update -qq --fix-missing && \
        apt-get install -y --no-install-recommends \
        git ninja-build libglib2.0-0 libsm6 libxrender-dev libxext6 libgl1-mesa-glx \
        build-essential \
        ca-certificates \
        cmake && \
    pip install -r /tmp/requirements.txt && rm -f /tmp/requirements.txt && \
    git clone https://github.com/open-mmlab/mmsegmentation.git /mmsegmentation && \
    pip install -r requirements.txt && \
    pip install --no-cache-dir -e . && \
    # Cleaning
    apt-get remove -y \
        build-essential \
        ca-certificates \
        cmake \
        curl \
        git \
        jq \
        libopenmpi-dev \
        unzip \
        wget && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /root/.cache && \
    rm -rf /var/lib/apt/lists/* && \
    chgrp -R 0 /root && \
    chmod -R g+rwX /root

