<image align="right" alt="Lunchpail icon" src="docs/lunchpail.png" title="Lunchpail" width="64">

# Lunchpail

<a href="https://github.com/IBM/lunchpail/releases"><img src="https://img.shields.io/github/release/IBM/lunchpail.svg" alt="Latest Release"></a>
[![CI Tests](https://github.com/IBM/lunchpail/actions/workflows/actions.yml/badge.svg)](https://github.com/IBM/lunchpail/actions/workflows/actions.yml)

Lunchpail compiles your job code into an all-in-one executable. Others download that binary, and `up` it to run your code in the Cloud or an existing Kubernetes cluster. 

<img src="docs/status0.png" width="200"> <img src="docs/status1.png" width="200"> <img src="docs/status2.png" width="200">

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

## Getting Started

- [Try a demo](./docs/demos/README.md). We have used Lunchpail to build binaries of several demo applications.
- [Build binaries for your application](./docs/build/README.md)
- [Develop Lunchpail itself](./docs/contribute/README.md)

## And... Welcome!

Lunchpail is a new project. Bear with us, and please chip in if you
can, as we finish up the initial polishing passes.

