FROM alpine:3

# Note: watcher.sh depends on some bash-isms at the moment
RUN apk update && \
        apk add --no-cache inotify-tools bash

ADD sysctl.conf /etc/sysctl.d/codeflare.conf
COPY bin /opt/codeflare/worker/bin
RUN chmod a+rX /opt/codeflare/worker/bin/*

RUN addgroup -g 2000 jaas && adduser -u 2000 jaas -G jaas --disabled-password && echo "jaas:jaas" | chpasswd
USER jaas

CMD ["/opt/codeflare/worker/bin/watcher.sh"]
