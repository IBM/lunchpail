FROM docker.io/python:3.12-slim
LABEL org.opencontainers.image.source="https://github.com/IBM/lunchpail"

RUN apt update && apt install -y bc && apt autoremove -y && apt clean && rm -rf ~/.cache && rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir \
    pandas \
    pyarrow \
    torch \
    transformers
