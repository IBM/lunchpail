FROM ghcr.io/ibm/lunchpail-fastparquet:0.0.1
LABEL org.opencontainers.image.source https://github.com/IBM/lunchpail

COPY --chmod=755 main.sh /opt/lunchpail/bin/main.sh

RUN apk update && apk add --no-cache rclone && \
    adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

CMD ["/opt/lunchpail/bin/main.sh"]
