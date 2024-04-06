For example:

```shell
podman manifest create ghcr.io/lunchpail/torchx-slim:0.0.10
podman build \
    --platform=linux/arm64/v8,linux/amd64 \
        --manifest ghcr.io/lunchpail/torchx-slim:0.0.10 .
```

Then, to push:

```shell
podman manifest push ghcr.io/lunchpail/torchx-slim:0.0.10
```
