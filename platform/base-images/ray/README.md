For example:

```shell
podman manifest create ghcr.io/lunchpail/ray22:0.1.2
podman build \
    --platform=linux/arm64/v8,linux/amd64 \
        --manifest ghcr.io/lunchpail/ray22:0.1.2 .
```

Then, to push:

```shell
podman manifest push ghcr.io/lunchpail/ray22:0.1.2
```

