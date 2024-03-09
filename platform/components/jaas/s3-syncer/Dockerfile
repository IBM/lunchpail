FROM rclone/rclone:1.65

RUN apk update && apk add --no-cache bash

COPY bin /opt/lunchpail/syncer/bin
RUN chmod a+rX /opt/lunchpail/syncer/bin

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

# Note: this has to be ENTRYPOINT rather than CMD, due to the
# rclone/rclone base we inherit from
ENTRYPOINT ["/opt/lunchpail/syncer/bin/main.sh"]
