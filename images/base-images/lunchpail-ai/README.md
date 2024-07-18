For example:

```shell
podman manifest create ghcr.io/ibm/lunchpail-ai:0.0.4
podman build \
    --platform=linux/arm64/v8,linux/amd64 \
        --manifest ghcr.io/ibm/lunchpail-ai:0.0.4 .
```

Then, to push:

```shell
podman manifest push ghcr.io/ibm/lunchpail-ai:0.0.4
```

