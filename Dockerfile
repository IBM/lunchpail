# download go modules
FROM docker.io/golang:1.22.6-alpine as base
LABEL lunchpail=temp
WORKDIR /init

ENV CGO_ENABLED=0

COPY go.mod .
COPY go.sum .
RUN --mount=type=cache,target=/root/.cache/go-build --mount=type=cache,target=/go/pkg/mod go mod download -x

COPY cmd cmd
COPY pkg pkg
COPY charts charts

# build the CLI
FROM base as builder
LABEL lunchpail=temp
RUN --mount=type=cache,target=/root/.cache/go-build --mount=type=cache,target=/go/pkg/mod \
    go generate ./... && \
    go generate ./... && \
    go build -ldflags="-s -w" -o /tmp/lunchpail cmd/main.go && \
    find . -name '*.tar.gz' -exec rm {} \; && \
    chmod a+rX /tmp/lunchpail

FROM docker.io/alpine:3
LABEL lunchpail=final org.opencontainers.image.source="https://github.com/IBM/lunchpail"

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

COPY --from=builder /tmp/lunchpail /usr/local/bin/lunchpail

USER lunchpail
CMD ["lunchpail"]
