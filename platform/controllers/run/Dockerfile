FROM ghcr.io/project-codeflare/torchx-slim:0.0.8

# install rclone
RUN apt update && apt install -y rclone && apt autoremove -y && rm -rf /var/lib/apt/lists/*

RUN adduser --uid 2000 lunchpail --ingroup root --disabled-password && echo "lunchpail:lunchpail" | chpasswd && chmod -R g=u /home/lunchpail
USER lunchpail
ENV HOME=/home/lunchpail
WORKDIR /home/lunchpail

ADD src /src
CMD kopf run /src/handlers.py --verbose
