FROM ghcr.io/project-codeflare/codeflare-workerpool-worker-alpine-component:dev

# Note: watcher.sh depends on some bash-isms at the moment
RUN apk update && \
        apk add --no-cache python3 make
