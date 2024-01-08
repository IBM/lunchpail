FROM rclone/rclone:1.64

RUN apk update && apk add --no-cache bash
COPY bin /opt/codeflare/syncer/bin

# Note: this has to be ENTRYPOINT rather than CMD, due to the
# rclone/rclone base we inherit from
ENTRYPOINT ["/opt/codeflare/syncer/bin/main.sh"]
