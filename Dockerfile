FROM docker.io/golang:1.22.6-alpine as builder
WORKDIR /init

ENV CGO_ENABLED=0
COPY go.* .
RUN go mod download

COPY cmd cmd
COPY pkg pkg
COPY charts charts

# build the CLI
RUN go generate ./... && \
    go generate ./... && \
    go build -ldflags="-s -w" -o lunchpail cmd/main.go && \
    chmod a+rX lunchpail && \
    find . -name '*.tar.gz' -exec rm {} \;

FROM docker.io/alpine:3
LABEL org.opencontainers.image.source="https://github.com/IBM/lunchpail"

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

COPY --from=builder /init/lunchpail /usr/local/bin/lunchpail

USER lunchpail
CMD ["lunchpail"]
