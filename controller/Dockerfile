FROM ghcr.io/lunchpail/kopf:0.0.4

# install rclone
RUN apk update && apk add --no-cache rclone

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

COPY --chown=lunchpail:root src .
CMD kopf run application_handlers.py run_handlers.py --verbose
