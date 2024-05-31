# Build stage
FROM docker.io/golang:1.22.1-alpine
WORKDIR /workstealer

COPY go.* ./
RUN go mod download

COPY main.go .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o workstealer
RUN chmod a+rX workstealer

# Final stage
FROM docker.io/alpine:3
COPY --from=0 /workstealer/workstealer /home/lunchpail/workstealer

RUN apk update && apk add --no-cache rclone bash diffutils

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

COPY workstealer.sh .

CMD ["./workstealer.sh"]
