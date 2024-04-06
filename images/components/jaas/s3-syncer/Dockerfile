FROM docker.io/rclone/rclone:1

RUN apk update && apk add --no-cache bash

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

COPY --chown=lunchpail:root bin .

# Note: this has to be ENTRYPOINT rather than CMD, due to the
# rclone/rclone base we inherit from
ENTRYPOINT ["./main.sh"]
