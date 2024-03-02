FROM rclone/rclone:1.64

RUN apk update && apk add --no-cache bash

COPY bin /opt/codeflare/syncer/bin
RUN chmod a+rX /opt/codeflare/syncer/bin

RUN addgroup -g 2000 jaas && adduser -u 2000 jaas -G jaas --disabled-password && echo "jaas:jaas" | chpasswd
USER jaas

# Note: this has to be ENTRYPOINT rather than CMD, due to the
# rclone/rclone base we inherit from
ENTRYPOINT ["/opt/codeflare/syncer/bin/main.sh"]
