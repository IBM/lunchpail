FROM docker.io/bitnami/minio-client:2024.3.3

USER root
RUN apt update && \
    apt -y install git ca-certificates ncurses-bin && \
    apt clean autoclean && apt autoremove --yes && rm -rf /var/lib/{apt,dpkg,cache,log}/
ADD bin /opt/lunchpail/bin

USER 1001
ENV TERM=xterm-256color

ENTRYPOINT ["/opt/lunchpail/bin/main.sh"]
