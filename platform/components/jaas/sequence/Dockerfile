FROM docker.io/bitnami/kubectl

USER root
COPY main.sh /usr/local/bin/jaas-sequencer.sh
RUN chmod a+rX /usr/local/bin/jaas-sequencer.sh
USER 1001

ENTRYPOINT /usr/local/bin/jaas-sequencer.sh
