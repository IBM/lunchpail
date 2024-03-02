FROM ghcr.io/project-codeflare/torchx-slim:0.0.8

RUN addgroup --gid 2000 jaas && adduser --uid 2000 jaas --ingroup jaas --disabled-password && echo "jaas:jaas" | chpasswd
USER jaas

ADD src /src
CMD kopf run /src/handlers.py --verbose
