FROM golang:1.22.0-alpine
WORKDIR /opt/codeflare/

COPY go.* ./
RUN go mod download

COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -o workstealer

CMD ["/opt/codeflare/workstealer"]
