FROM docker.io/golang:1.22.1-alpine
WORKDIR /init

COPY go.* .
RUN go mod download
COPY *.go .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o watcher
RUN chmod a+rX watcher

FROM docker.io/alpine:3
COPY --from=0 /init/watcher /init/watcher

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail
