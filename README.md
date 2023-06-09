# CodeFlare Platform

[![Build Status](https://travis.ibm.com/cloud-computer/codeflare-platform.svg?token=q3a78CA7yxKpNpK2nBqK&branch=main)](https://travis.ibm.com/cloud-computer/codeflare-platform)

## Setting up IBM Internal Secrets

The examples require access to github.ibm.com. Please consult
[hack/my.secrets.sh.template](hack/my.secrets.sh.template).

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

To track the sample Runs:
```shell
kubectl get pod -n codeflare-watsonxai-examples -w
```
