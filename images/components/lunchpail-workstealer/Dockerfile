# Build stage
FROM docker.io/golang:1.22.6-alpine as builder
WORKDIR /workstealer

COPY go.* .
RUN go mod download

COPY *.go .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o workstealer
RUN chmod a+rX workstealer

# Final stage
FROM docker.io/alpine:3
LABEL org.opencontainers.image.source="https://github.com/IBM/lunchpail"

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

# for minio
EXPOSE 9000

RUN apk update && apk add --no-cache minio minio-client

USER lunchpail
COPY --from=builder /workstealer/workstealer /opt/lunchpail/workstealer/bin/workstealer
