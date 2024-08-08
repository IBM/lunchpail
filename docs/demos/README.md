# Lunchpail: Getting Started with Demos

Welcome to the Lunchpail demo page. The demo binaries described here
are all products of Lunchpail. Look [here](../build/README.md) for
guidance of building your own binaries.

> [!IMPORTANT]
> The demo commands below currently assume that you have a valid
> Kubernetes context. Cloud VM support and support for bringing up a
> local [Kind](https://github.com/kubernetes-sigs/kind) cluster will
> be documented soon.

- [Demo 1: Hello World](#demo-1-hello-world)
- [Demo 2: OpenROAD](#demo-2-openroad)

## Demo 1: Hello World

You can check out the [source](https://github.com/IBM/lunchpail-demo)
or download one of the [prebuilt
binaries](https://github.com/IBM/lunchpail-demo/releases). Say you
have downloaded the demo application for your platform to a local file
`demo`[^1]. Then use the binary in one of these modes:

- `./demo up` &mdash; starts a run and shows the status UI, which
runs in "full screen" mode in your terminal.  If you wish to start a
run without the status UI, add the `--watch=false` option.

- `./demo down` &mdash; terminates the last run

- `./demo status` &mdash; shows the status UI for the last run

[^1]: You can download the Hello World demo for your platform via: `curl -L https://github.com/IBM/lunchpail-demo/releases/latest/download/lunchpail-demo-$(uname | tr A-Z a-z)-$(uname -m | sed 's/x86_64/amd64/' | sed 's/aarch64/arm64/') -o demo && chmod +x demo`

## How we built `lunchpail-demo`

To build these binaries, we first downloaded the latest [Lunchpail
release](https://github.com/IBM/lunchpail/releases/latest) and then
ran:

```shell
lunchpail compile https://github.com/IBM/lunchpail-demo -o /tmp/lunchpail-demo -N
```

Here, we used the `-N` flag (short for `--create-namespace`) so that
users of the demo won't have to worry about managing namespaces.
Optionally, if you add the `-A` option, a set of platform binaries
will be generated. Without that flag, a single binary for the current
platform will be generated.

## Demo 2: OpenROAD

> [!WARNING]
> While this demo can run on MacOS Apple Silicon, it will run in
> emulation mode. Expect it to run a bit more slowly there.

[OpenROAD](https://theopenroadproject.org/) is an open-source
electronic design automation (EDA) tool suite. This suite of tools
helps with the optimization of chip designs, including timing and
geometry. The goal of this OpenROAD demo is to sweep a space of chip
design parameters in order to find a design with the smallest chip
area for a given set of timing constraints.
 
You can check out the
[source](https://github.com/IBM/lunchpail-openroad-max-utilization) or
download one of the [prebuilt
binaries](https://github.com/IBM/lunchpail-openroad-max-utilization/releases). Say
you have downloaded the OpenROAD demo for your platform to a local
file `openroad`[^2]. Then, the mechanics of `up` and `down` are the
same as for [the first demo](#demo-1-hello-world), except you use the
`./openroad` binary you downloaded.

[^2]: You can download the OpenROAD demo for your platform via: `curl -L https://github.com/IBM/lunchpail-openroad-max-utilization/releases/latest/download/lunchpail-openroad-$(uname | tr A-Z a-z)-$(uname -m | sed 's/x86_64/amd64/' | sed 's/aarch64/arm64/') -o openroad && chmod +x openroad`

## How we built `lunchpail-openroad`

To build these binaries, we first downloaded the latest [Lunchpail
release](https://github.com/IBM/lunchpail/releases/latest) and then
ran:

```shell
lunchpail compile https://github.com/IBM/lunchpail-openroad-max-utilization -o /tmp/lunchpail-openroad -N
```

See the [above commentary](#how-we-built-lunchpail-demo) for details.
