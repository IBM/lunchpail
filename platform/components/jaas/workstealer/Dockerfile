FROM golang:1.22.0-alpine
WORKDIR /opt/lunchpail/bin

COPY go.* ./
RUN go mod download

COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o workstealer
RUN chmod a+rX workstealer

FROM alpine:3
COPY --from=0 /opt/lunchpail/bin/workstealer /opt/lunchpail/bin/workstealer

RUN apk update && apk add --no-cache rclone bash

COPY workstealer.sh /opt/lunchpail/bin/workstealer.sh

RUN addgroup -g 2000 jaas && adduser -u 2000 jaas -G jaas --disabled-password && echo "jaas:jaas" | chpasswd
USER jaas

CMD ["/opt/lunchpail/bin/workstealer.sh"]
