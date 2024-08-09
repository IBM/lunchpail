 FROM docker.io/golang:1.22.6-alpine
WORKDIR /init

COPY .cache .cache
COPY hack/setup/cli.sh .
COPY go.* .
COPY cmd cmd
COPY pkg pkg
COPY charts charts

RUN ./cli.sh
RUN chmod a+rX lunchpail

FROM docker.io/alpine:3
LABEL org.opencontainers.image.source="https://github.com/IBM/lunchpail"

COPY --from=0 /init/lunchpail /usr/local/bin/lunchpail

RUN adduser -u 2000 lunchpail -G root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

CMD ["lunchpail"]
