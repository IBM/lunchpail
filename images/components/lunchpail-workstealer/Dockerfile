# Build stage
FROM docker.io/golang:1.22.1-alpine
LABEL org.opencontainers.image.source="https://github.com/IBM/lunchpail"
WORKDIR /workstealer

COPY go.* ./
RUN go mod download

COPY main.go .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o workstealer
RUN chmod a+rX workstealer

# Final stage
FROM docker.io/debian:stable-slim
COPY --from=0 /workstealer/workstealer /opt/lunchpail/workstealer/bin/workstealer

#RUN apk update && apk add --no-cache rclone bash diffutils
RUN apt update && apt install -y bash diffutils wget && \
    wget https://dl.min.io/server/minio/release/linux-$(dpkg --print-architecture)/archive/minio_20240528171904.0.0_$(dpkg --print-architecture).deb -O minio.deb && \
    wget https://downloads.rclone.org/v1.66.0/rclone-v1.66.0-linux-$(dpkg --print-architecture).deb -O rclone.deb && \
    dpkg -i minio.deb && rm -f minio.deb && \
    dpkg -i rclone.deb && rm -f rclone.deb && \
    apt-get remove -y wget && \
    apt-get autoremove -y && apt-get clean && rm -rf /root/.cache && rm -rf /var/lib/apt/lists/*

RUN adduser --uid 2000 lunchpail --ingroup root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

# for minio
EXPOSE 9000
