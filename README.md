# CodeFlare Platform

[![Build Status](https://travis.ibm.com/cloud-computer/codeflare-platform.svg?token=q3a78CA7yxKpNpK2nBqK&branch=main)](https://travis.ibm.com/cloud-computer/codeflare-platform)

## The Big Picture

The platform consists of the following types of resources, all of which are Kubernetes resource kinds:
- **Applications**: an application owner can define its properties,
  e.g. base image, minimal resource requirements, and the schema of
  its command line. Sizing constraints are expressed in terms of
  "tee-shirt sizing". [Example Ray
  Application.yaml](watsonx_ai/charts/applications/templates/examples/ray/qiskit.yaml)
  **|** [Example Torch
  Application.yaml](watsonx_ai/charts/applications/templates/examples/torch/lightning.yaml)
- **Runs**: an application user points to the Application resource
  they wish to execute. [Example Ray
  Run.yaml](tests/runs/watsonx_ai/ray/qiskit.yaml) **|** [Example
  Torch Application.yaml](tests/runs/watsonx_ai/torch/lightning.yaml)
- **RunSizeConfiguration**: instances of this kind allow admins to
  define a mapping from tee shirt sizes to physical size constraints
  on the cluster.
- [TODO] DataSets
- [TODO] Images

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

### Submitting Example Runs

Test Run resource specs are located in [tests/runs](tests/runs). To
stand them all up, you can use `./tests/kind/deploy-tests.sh`. Or you
can individually `kubectl apply -f` particular runs located within the
`tests/runs` directory.

The [`deploy-tests.sh`](./tests/kind/deploy-tests.sh) script is
convenient, in that it will also do a `kubectl get --watch` on the
test runs. Though you can also do this on your own, as it is really
just a simple watching get.

## Debugging the Controllers

The controllers will be visible in logs and events associated with
these resources:

```shell
kubectl get pod -n codeflare-system -w
```
