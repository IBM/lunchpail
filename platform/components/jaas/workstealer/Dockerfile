FROM docker.io/golang:1.22.0-alpine
WORKDIR /opt/lunchpail/bin

COPY go.* ./
RUN go mod download

COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o workstealer
RUN chmod a+rX workstealer

FROM docker.io/alpine:3
COPY --from=0 /opt/lunchpail/bin/workstealer /opt/lunchpail/bin/workstealer

RUN apk update && apk add --no-cache rclone bash

ADD sysctl.conf /etc/sysctl.d/lunchpail.conf
COPY workstealer.sh /opt/lunchpail/bin/workstealer.sh

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

CMD ["/opt/lunchpail/bin/workstealer.sh"]
