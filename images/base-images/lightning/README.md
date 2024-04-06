For example:

```shell
podman manifest create ghcr.io/lunchpail/lightning:0.0.7
podman build \
    --platform=linux/arm64/v8,linux/amd64 \
        --manifest ghcr.io/lunchpail/lightning:0.0.7 .
```

Then, to push:

```shell
podman manifest push ghcr.io/lunchpail/lightning:0.0.7
```
