FROM docker.io/alpine:3

USER root
RUN apk update && \
    apk add --no-cache git ca-certificates minio-client

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
ENV TERM=xterm-256color
WORKDIR /home/lunchpail

COPY --chown=lunchpail:root bin .

ENTRYPOINT ["./main.sh"]
