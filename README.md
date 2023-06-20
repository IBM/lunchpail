# CodeFlare Platform

[![Build Status](https://travis.ibm.com/cloud-computer/codeflare-platform.svg?token=q3a78CA7yxKpNpK2nBqK&branch=main)](https://travis.ibm.com/cloud-computer/codeflare-platform)

## The Big Picture

The Codeflare Platform helps users and operators with running
large-scale jobs on a multi-tenant Kubernetes cluster. It consists of
a set of Kubernetes [**resource types**](#resource-types) managed by a
collection of Kubernetes **controllers** that operate under a defined
set of [**policies**](#policy-types).

Architecturally, the CodeFlare Platform is a [Helm
chart](https://helm.sh). Via [Helm
dependencies](https://helm.sh/docs/helm/helm_dependency/), you can
incorporate a custom platform. You may include your own set of
applications, datasets, images, and policies to shape an experience
for your users. It is relatively lightweight, and runs fine in
[Kind](#local-development-using-kind) on most laptops.

<a name="resource-types">

### How the Platform Helps with Defining and Running Jobs

- **The Applications**: an application owner can define its properties,
  e.g. base image, minimal resource requirements, and the schema of
  its command line. Sizing constraints are expressed in terms of
  "tee-shirt sizing". [Example Ray
  Application.yaml](watsonx_ai/charts/applications/templates/examples/ray/qiskit.yaml)
  **|** [Example Torch
  Application.yaml](watsonx_ai/charts/applications/templates/examples/torch/lightning.yaml)
- **The DataSets**: application owners may associate one or more input
  data sets with their application specification. [Example
  DataSet.yaml](https://github.ibm.com/nickm/codeflare-platform/blob/rm/tests/templates/datasets/s3-test.yaml)
- **The Runs**: an application user points to the Application resource
  they wish to execute. [Example Ray
  Run.yaml](tests/runs/watsonx_ai/ray/qiskit.yaml) **|** [Example
  Torch Application.yaml](tests/runs/watsonx_ai/torch/lightning.yaml)
- [TODO] Images

<a name="policy-types">

### How the Platform Helps with Defining Policies

- **RunSizeConfiguration**: instances of this kind allow admins to
  define a mapping from tee shirt sizes to physical size constraints
  on the cluster.

## Getting Started

### Local Development using Kind

For local development, make sure you have Docker running, and
[Kind](https://kind.sigs.k8s.io/) installed (`brew install kind`).

```shell
# Bring the platform up
./hack/up.sh

# Tear it down
./hack/down.sh
```

### Setting up IBM Internal Secrets

The example applications are defined to keep their source in
github.ibm.com. Thus, running these currently requires that the
CodeFlare controllers have access to github.ibm.com. Please consult
[hack/my.secrets.sh.template](hack/my.secrets.sh.template) to set up
the required secret.

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
