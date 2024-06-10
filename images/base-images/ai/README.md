For example:

```shell
podman manifest create ghcr.io/lunchpail/ai:0.0.3
podman build \
    --platform=linux/arm64/v8,linux/amd64 \
        --manifest ghcr.io/lunchpail/ai:0.0.3 .
```

Then, to push:

```shell
podman manifest push ghcr.io/lunchpail/ai:0.0.3
```

