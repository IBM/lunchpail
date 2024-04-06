Note: linux/amd64 only at the moment. See the Dockerfile FROM
line. Lots of amd64-only bits in the jinwookjung/rdf-openroad-ray base
image.

```shell
podman build \
    --platform=linux/amd64 \
        --tag ghcr.io/lunchpail/workerpool-worker-ubuntu-python-openroad:0.2.0 .
```

## TODO whenever we support arm64

```shell
podman manifest create ghcr.io/lunchpail/workerpool-worker-ubuntu-python-openroad:0.2.0
podman build \
    --platform=linux/arm64/v8,linux/amd64 \
        --manifest ghcr.io/lunchpail/workerpool-worker-ubuntu-python-openroad:0.2.0 .
```

Then, to push:

```shell
podman manifest push ghcr.io/lunchpail/workerpool-worker-ubuntu-python-openroad:0.2.0
```
