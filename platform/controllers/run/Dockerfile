FROM ghcr.io/project-codeflare/torchx-slim:0.0.8

# install rclone
RUN apt update && apt install -y rclone && apt autoremove -y && rm -rf /var/lib/apt/lists/*

RUN addgroup --gid 2000 jaas && adduser --uid 2000 jaas --ingroup jaas --disabled-password && echo "jaas:jaas" | chpasswd
USER jaas
ENV HOME=/home/jaas
WORKDIR /home/jaas

ADD src /src
CMD kopf run /src/handlers.py --verbose
