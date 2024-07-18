FROM alpine:3
LABEL org.opencontainers.image.source https://github.com/IBM/lunchpail

RUN ARCH=$(uname -m); if [ $ARCH = "x86_64" ]; then TARGETARCH=amd64; else TARGETARCH=arm64; fi ; \
    apk update && apk add --no-cache bash && \
    wget https://downloads.rclone.org/v1.66.0/rclone-v1.66.0-linux-$TARGETARCH.zip -O rclone.zip && \
    unzip rclone.zip && rm rclone.zip && \
    mv rclone-v1.66.0-linux-$TARGETARCH/rclone /usr/local/bin/rclone && \
    chmod a+rx /usr/local/bin/rclone
