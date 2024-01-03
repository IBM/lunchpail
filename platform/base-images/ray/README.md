For example:

```shell
podman build \
    --platform=linux/arm64/v8,linux/amd64 \
        --manifest ghcr.io/project-codeflare/ray22:0.1.1 .
```

Then, to push:

```shell
podman manifest push ghcr.io/project-codeflare/ray22:0.1.1
```

