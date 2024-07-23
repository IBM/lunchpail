<image align="right" alt="Lunchpail icon" src="docs/lunchpail.png" title="Lunchpail" width="64">

# Lunchpail

<a href="https://github.com/IBM/lunchpail/releases"><img src="https://img.shields.io/github/release/IBM/lunchpail.svg" alt="Latest Release"></a>
[![CI Tests](https://github.com/IBM/lunchpail/actions/workflows/actions.yml/badge.svg)](https://github.com/IBM/lunchpail/actions/workflows/actions.yml)

Lunchpail takes your code and creates a executable. Others download
that binary, and `up` it to run code in the Cloud or an existing
Kubernetes cluster.

> Lunchpail is a new project. Bear with us, and please chip in if you
> can, as we finish up the initial polishing passes.

What you get, as an **application owner**: a way to shrink-wrap and
distribute your code without having to worry about coding or
maintaining the logic for deployment, scaling, load balancing,
observability, etc.

What you get, as a **platform engineer**: a way to shrink-wrap the
variants of base application logic for your team's use cases. These
also become distributable binaries that also contain everything needed
for your team to run and observe jobs.

What you get, as an **end user** or **automator**: you can stitch
together the steps of your automation, because each step is a black
box application created by the above.

What you get, as a **budgeter** of time and money: you can have your
developers run the applications in a mode that only queues up work.
Separately, you allocate or reduce resources assigned to each queue,
as your budget allows.

## Getting Started with a Demo Application

We have a simple [demo
application](https://github.com/IBM/lunchpail-demo). You can check out
the source and download one of the [prebuilt
binaries](https://github.com/IBM/lunchpail-demo/releases). For
example, if you are on MacOS with Apple Silicon:

```shell
curl -LO https://github.com/IBM/lunchpail-demo/releases/download/v0.1.0/lunchpail-demo-darwin-arm64 && chmod +x lunchpail-demo-darwin-arm64
./lunchpail-demo-darwin-arm64 up --create-namespace --watch
```

> Note: the above command currently requires that you have a valid
> Kubernetes context.

## Getting Started as an Application Developer

- [Download](https://github.com/IBM/lunchpail/releases/latest) the latest `lunchpail` CLI.
- Try out `lunchpail assemble` to generate binaries for your application.
