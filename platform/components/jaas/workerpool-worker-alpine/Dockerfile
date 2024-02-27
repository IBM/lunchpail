FROM alpine:3

# Note: watcher.sh depends on some bash-isms at the moment
RUN apk update && \
        apk add --no-cache inotify-tools bash

ADD sysctl.conf /etc/sysctl.d/codeflare.conf
COPY bin /opt/codeflare/worker/bin

CMD ["/opt/codeflare/worker/bin/watcher.sh"]
