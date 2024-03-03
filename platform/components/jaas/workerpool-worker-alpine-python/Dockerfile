ARG registry=ghcr.io
arg repo=project-codeflare
ARG version=0.0.1
FROM $registry/$repo/jaas-workerpool-worker-alpine-component:$version

# Note: watcher.sh depends on some bash-isms at the moment
USER root
RUN apk update && \
        apk add --no-cache python3 make
USER jaas
