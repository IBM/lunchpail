# CodeFlare Platform

## Setting up IBM Internal Secrets

The examples require access to github.ibm.com. Please consult
[hack/secrets.sh.template](hack/secrets.sh.template).

## Getting Started (Local Development)

For local development, make sure you have Docker running, and [Kind](https://kind.sigs.k8s.io/) installed (`brew install kind`).

```shell
# Bring the platform up
./hack/up.sh

# Tear it down
./hack/down.sh
```

## Tracking the resources

To track the controllers:

```shell
kubectl get pod -n codeflare-system -w
```

To track the sample Run:
```shell
kubectl get pod -n codeflare-application-example-lightning -w
```
