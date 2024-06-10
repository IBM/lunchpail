FROM docker.io/python:3.12-slim

RUN apt update && apt install -y rclone && apt autoremove -y && apt clean && rm -rf ~/.cache && rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir \
    pandas \
    pyarrow \
    torch \
    transformers
