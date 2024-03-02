FROM ghcr.io/project-codeflare/torchx-slim:0.0.8

# install busybox for its `cp` (GNU coreutils cp has issues copying to goofys/minio)
# Error: cp: setting permissions for '...': Software caused connection abort
# Error: cp: preserving permissions for '...': Software caused connection abort
RUN apt update && apt install -y busybox && apt autoremove -y && rm -rf /var/lib/apt/lists/*

RUN addgroup --gid 2000 jaas && adduser --uid 2000 jaas --ingroup jaas --disabled-password && echo "jaas:jaas" | chpasswd
USER jaas

ADD src /src
CMD kopf run /src/handlers.py --verbose
