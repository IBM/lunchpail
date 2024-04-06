For example:

# 0.0.1 python 3.10-alpine
# 0.0.2 python 3.12-alpine
# 0.0.3 upx compression on kubectl and helm [20240301]
# 0.0.4 move project-codeflare -> lunchpail [20240314]

```shell
podman manifest create ghcr.io/lunchpail/kopf:0.0.4
podman build --platform=linux/arm64/v8,linux/amd64 --manifest ghcr.io/lunchpail/kopf:0.0.4 .
podman manifest push ghcr.io/lunchpail/kopf:0.0.4
```
