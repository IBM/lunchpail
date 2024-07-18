FROM alpine:3
LABEL org.opencontainers.image.source https://github.com/IBM/lunchpail

RUN apk update && apk add --no-cache git ca-certificates bash
ADD clone.sh /opt/lunchpail/bin/clone.sh

CMD /opt/lunchpail/bin/clone.sh
