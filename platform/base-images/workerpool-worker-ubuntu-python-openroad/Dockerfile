FROM --platform=linux/amd64 ubuntu:18.04

# Note: watcher.sh depends on some bash-isms at the moment
RUN apt update && \
    apt install -y inotify-tools bash make python3 libtcl8.5 time libgomp1 libpython3.6 libqt5widgets5 curl ca-certificates && \
    curl -LO https://www.klayout.org/downloads/Ubuntu-18/klayout_0.28.13-1_amd64.deb && \
    apt install -y ./klayout_0.28.13-1_amd64.deb && \
    (cd /lib/x86_64-linux-gnu && ln -s libreadline.so.7  libreadline.so.6) && \
    ln -sf /bin/bash /bin/sh && \
    apt autoremove && \
    rm -rf /var/lib/{apt,dpkg,cache,log}/

ADD sysctl.conf /etc/sysctl.d/lunchpail.conf
COPY bin /opt/lunchpail/worker/bin

CMD ["/opt/lunchpail/worker/bin/watcher.sh"]

COPY --from=jinwookjung/rdf-openroad-ray /openroad /openroad
#COPY --from=openroad/yosys /install ./tools/install/yosys
#COPY --from=openroad/centos7-builder-gcc /OpenROAD/build/src/openroad ./tools/install/OpenROAD/bin/openroad
#COPY --from=openroad/centos7-builder-gcc /OpenROAD/etc/DependencyInstaller.sh /etc/DependencyInstaller.sh
#RUN /etc/DependencyInstaller.sh -runtime
#COPY --from=openroad/lsoracle /LSOracle/build/core/lsoracle ./tools/build/LSOracle/bin/lsoracle
#COPY --from=openroad/lsoracle /LSOracle/core/test.ini ./tools/build/LSOracle/share/lsoracle/test.ini
#COPY --from=openroad/lsoracle /LSOracle/build/yosys-plugin/oracle.so /openroad/tools/build/yosys/share/yosys/plugins/
## COPY ./submodules/OpenROAD-flow-scripts/setup_env.sh .
## COPY ./submodules/OpenROAD-flow-scripts/flow ./flow
## RUN chmod o+rw -R /OpenROAD-flow

ENV PATH="/openroad/tools/install/OpenROAD/bin:/openroad/tools/install/yosys/bin:/openroad/tools/install/LSOracle/bin:/assure-bin/bin:/opt/Fault:${PATH}"
ENV YOSYS_CMD=/openroad/tools/install/yosys/bin/yosys
ENV OPENROAD_EXE=/openroad/tools/install/OpenROAD/bin/openroad
