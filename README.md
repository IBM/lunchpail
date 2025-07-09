<image align="right" alt="Lunchpail icon" src="docs/lunchpail.png" title="Lunchpail" width="64">

# Lunchpail

[![CI Tests](https://github.com/IBM/lunchpail/actions/workflows/tests.yml/badge.svg)](https://github.com/IBM/lunchpail/actions/workflows/tests.yml)

Lunchpail compiles your job code into an all-in-one executable. Others
download that binary, and `up` it to run your code locally, in a
Kubernetes cluster, or on run-and-done virtual machines in the Cloud.

[Slides](https://ibm.box.com/s/mb6o9z2oyah66efc69lkej3tuzshum3q)

## Getting Started

> We will soon be publishing prebuilt executables. Bear with us.

First, clone this repository. From there, you can build the main
`lunchpail` binary. Using `lunchpail build` , you can then build
separate binaries, one for each of your applications. You will find a
collection of demo applications in the [demos/](./demos) directory of
this repository.

After cloning this repo to build `lunchpail`. Lunchpail is written in
Go. If you don't yet have `go` installed, you can do so on MacOS via
`brew install go`, or consult the [Go installation
docs](https://go.dev/doc/install). Then:

```shell
./hack/setup/cli.sh
```

This will generate a `./lunchpail` binary. Next, to build one of the demo applications:

```shell
./lunchpail build -o cq ./demos/data-prep-kit/code/code-quality
```

Next, you can run `cq` against its test inputs on your laptop via:

```shell
./cq test -t local
```

If you want to run it against your current Kubernetes context, change
`-t local` to `-t kubernetes`.
