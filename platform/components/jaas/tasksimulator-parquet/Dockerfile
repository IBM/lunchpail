FROM ghcr.io/project-codeflare/jaas-s3-syncer-component:dev

# RUN apk add --no-cache maven curl build-base openjdk11 && \
#     cd /tmp && \
#     curl -L http://archive.apache.org/dist/thrift/0.16.0/thrift-0.16.0.tar.gz | tar zxf - && \
#     cd thrift-0.16.0 && \
#     chmod +x ./configure && \
#     ./configure --disable-libs && \
#     make install && \
#     cd .. && rm -rf thrift-0.16.0 && \
#     curl -L https://downloads.apache.org/parquet/apache-parquet-1.13.1/apache-parquet-1.13.1.tar.gz | tar zxf - && \
#     cd apache-parquet-1.13.1 && \
#     mvn package -pl parquet-cli -am -Plocal -Dmaven.test.skip=true && \
#     mkdir /usr/local/parquet-cli && \
#     cp -a parquet-cli/target/ /usr/local/parquet-cli && \
#     cd .. && rm -rf apache-parquet-1.13.1 && \
#     rm -rf ~/.m2 && \
#     apk del maven curl build-base
#RUN cd /usr/local && tar zxf /tmp/parquet-cli.tar.gz && rm /tmp/parquet-cli.tar.bz2

RUN apk add --no-cache cargo build-base python3 py-pandas python3-dev py3-pip git && \
    pip --no-cache-dir install fastparquet && \
    apk del python3-dev build-base git cargo && \
    rm -rf ~/.cache && \
    rm -rf ~/.cargo && \
    rm -rf /usr/lib/python3.11/site-packages/pandas/tests && \
    rm -rf /usr/lib/python3.11/site-packages/numpy/core/tests
