For example:

```shell
podman manifest create ghcr.io/ibm/lunchpail-fastparquet:0.0.1
podman build \
    --platform=linux/arm64/v8,linux/amd64 \
        --manifest ghcr.io/ibm/lunchpail-fastparquet:0.0.1 .
```

Then, to push:

```shell
podman manifest push ghcr.io/ibm/lunchpail-fastparquet:0.0.1
```

