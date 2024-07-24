<image align="right" alt="Lunchpail icon" src="docs/lunchpail.png" title="Lunchpail" width="64">

# Lunchpail

<a href="https://github.com/IBM/lunchpail/releases"><img src="https://img.shields.io/github/release/IBM/lunchpail.svg" alt="Latest Release"></a>
[![CI Tests](https://github.com/IBM/lunchpail/actions/workflows/actions.yml/badge.svg)](https://github.com/IBM/lunchpail/actions/workflows/actions.yml)

Lunchpail compiles your job code into an all-in-one executable. Others download that binary, and `up` it to run your code in the Cloud or an existing Kubernetes cluster. 

<table>
    <tr>
        <td>
            <strong>Application Owners</strong> shrink-wrap and distribute code as binaries. Lunchpail bundles your code with the logic for deployment, scaling, load balancing, observability, etc.
        </td>
        <td>
            <strong>Platform engineers</strong> can shrink-wrap the variants of base application logic for their team's use cases. These also become distributable binaries.
        </td>
    </tr>
    <tr>
        <td>
            <strong>End users</strong> or <strong>automators</strong> can stitch together the steps of automation, because each step is a black box shrink-wrapped application.
        </td>
        <td>
            <strong>Budgeters</strong> and <strong>managers</strong> can have their developers run the applications in a mode that only queues up work. Separately, one can use the same binary to allocate or reduce resources assigned to each queue, as budget allows.
        </td>
    </tr>
</table>

## Getting Started with a Demo Application

We have a simple demo application. You can check out the
[source](https://github.com/IBM/lunchpail-demo) or download one of the
[prebuilt
binaries](https://github.com/IBM/lunchpail-demo/releases). For
example, if you are on MacOS with Apple Silicon:

```shell
curl -L https://github.com/IBM/lunchpail-demo/releases/latest/download/lunchpail-demo-darwin-arm64 -o lunchpail-demo && chmod +x lunchpail-demo
./lunchpail-demo up --create-namespace
```

> Note: the above command currently requires that you have a valid
> Kubernetes context.

## Getting Started as an Application Developer

- [Download](https://github.com/IBM/lunchpail/releases/latest) the latest `lunchpail` CLI.
- Try out `lunchpail assemble` to generate binaries for your application.

## And... Welcome!

Lunchpail is a new project. Bear with us, and please chip in if you
can, as we finish up the initial polishing passes.

