# Build stage
FROM docker.io/golang:1.22.6-alpine
LABEL org.opencontainers.image.source="https://github.com/IBM/lunchpail"
WORKDIR /workstealer

COPY go.* ./
RUN go mod download

COPY main.go .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o workstealer
RUN chmod a+rX workstealer

# Final stage
FROM docker.io/alpine:3
COPY --from=0 /workstealer/workstealer /opt/lunchpail/workstealer/bin/workstealer

RUN apk update && apk add --no-cache diffutils rclone minio

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

# for minio
EXPOSE 9000
