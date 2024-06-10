FROM docker.io/alpine:3

# Note: watcher.sh depends on some bash-isms at the moment
RUN apk update && \
        apk add --no-cache bash python3 make

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail
