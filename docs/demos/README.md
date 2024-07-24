# Lunchpail: Getting Started with Demos

We have a couple of demo applications. These have all been [built with
Lunchpail](../build/README.md).

> Note: the command below currently require that you have a valid
> Kubernetes context. Cloud VM support will be documented soon.

## Simple Hello World

You can check out the
[source](https://github.com/IBM/lunchpail-demo) or download one of the
[prebuilt
binaries](https://github.com/IBM/lunchpail-demo/releases). For
example, if you are on MacOS with Apple Silicon:

```shell
curl -L https://github.com/IBM/lunchpail-demo/releases/latest/download/lunchpail-demo-darwin-arm64 -o lunchpail-demo && chmod +x lunchpail-demo
./lunchpail-demo up --create-namespace
```
