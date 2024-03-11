FROM docker.io/alpine:3

# Note: watcher.sh depends on some bash-isms at the moment
RUN apk update && \
        apk add --no-cache inotify-tools bash

ADD sysctl.conf /etc/sysctl.d/lunchpail.conf
COPY bin /opt/lunchpail/worker/bin
RUN chmod a+rX /opt/lunchpail/worker/bin/*

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

CMD ["/opt/lunchpail/worker/bin/watcher.sh"]
