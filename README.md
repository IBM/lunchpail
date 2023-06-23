# CodeFlare Platform

[![Build Status](https://travis.ibm.com/cloud-computer/codeflare-platform.svg?token=q3a78CA7yxKpNpK2nBqK&branch=main)](https://travis.ibm.com/cloud-computer/codeflare-platform)

The Codeflare Platform helps users and operators with running
large-scale jobs on a multi-tenant Kubernetes cluster. It consists of
a set of high-level [**resource types**](#resource-types) managed by a
collection of Kubernetes **controllers** that operate under a defined
set of high-level [**policies**](#policy-types).

<img src="docs/codeflare-platform-architecture.png" alt="CodeFlare Architecture" align="right" width="450">

<a name="resource-types">

## High-level Resource API

- **Applications**: the Platform allows application owners to
  capture what it takes to fire off run of their apps; e.g. base
  image, minimal resource requirements, and the schema of its command
  line. Sizing constraints are expressed in terms of "tee-shirt
  sizing". [Example Ray
  Application.yaml](watsonx_ai/charts/applications/templates/examples/ray/qiskit.yaml)
  **|** [Example Torch
  Application.yaml](watsonx_ai/charts/applications/templates/examples/torch/lightning.yaml)
- **DataSets**: application owners may associate one or more input
  data sets with their application specification. The Platform takes
  care of managing all of the Kubernetes details (volumes, mounts, claims,
  etc.) [Example
  DataSet.yaml](https://github.ibm.com/nickm/codeflare-platform/blob/rm/tests/templates/datasets/s3-test.yaml)
- **Jobs/Runs**: an application user points to the Application
  resource they wish to execute, optionally overriding application
  defaults such as command line options. [Example Ray
  Run.yaml](tests/runs/watsonx_ai/ray/qiskit.yaml) **|** [Example
  Torch Application.yaml](tests/runs/watsonx_ai/torch/lightning.yaml)
- [TODO] Images

<a name="policy-types">

## High-level Policy API

- **RunSizeConfiguration**: instances of this kind allow admins to
  define a mapping from tee shirt sizes to physical size constraints
  on the cluster.
  
## Technologies Employed

The CodeFlare Platform brings together a number of popular
technologies, and links them together with some new data types and
controller logic. The existing technologies employed include (in
alphabetical order):

- [Datashim](https://github.com/datashim-io/datashim)
- [Fluentbit](https://fluentbit.io/)
- [KubeRay](https://github.com/ray-project/kuberay)
- [Kubernetes Co-scheduler](https://github.com/kubernetes-sigs/scheduler-plugins)
- [Multi-cluster App Dispatcher](https://github.com/project-codeflare/multi-cluster-app-dispatcher)
- [TorchX](https://pytorch.org/torchx/latest/)

## Getting Started

Architecturally, the CodeFlare Platform is a [Helm
chart](https://helm.sh). Via [Helm
dependencies](https://helm.sh/docs/helm/helm_dependency/), you can
incorporate a custom platform. You may include your own set of
applications, datasets, images, and policies to shape an experience
for your users. It is relatively lightweight, and runs fine in
[Kind](#local-development-using-kind) on most laptops.

To get started with contributing the Platform, see the
[Platform Developer Documentation](docs/development.md).
