FROM ghcr.io/project-codeflare/torchx-slim:0.0.8

RUN adduser --uid 2000 lunchpail --ingroup root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail

ADD src /src
CMD kopf run /src/handlers.py --verbose
