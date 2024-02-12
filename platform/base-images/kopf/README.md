For example:

# 0.0.1 python 3.10-alpine
# 0.0.2 python 3.12-alpine

```shell
KUBECONFIG=~/.kube/config docker buildx build --push \
    --platform=linux/arm64/v8,linux/amd64 \
        --tag ghcr.io/project-codeflare/kopf:0.0.2 .
```
