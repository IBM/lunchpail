FROM bitnami/minio-client:2023-debian-11

USER root
RUN apt update && \
    apt -y install git ca-certificates && \
    apt clean autoclean && apt autoremove --yes && rm -rf /var/lib/{apt,dpkg,cache,log}/
ADD bin /opt/codeflare/bin

USER 1001

ENTRYPOINT ["/opt/codeflare/bin/main.sh"]
