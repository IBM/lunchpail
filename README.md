<image align="right" alt="Lunchpail icon" src="docs/lunchpail.png" title="Lunchpail" width="64">

# Lunchpail

<a href="https://github.com/IBM/lunchpail/releases"><img src="https://img.shields.io/github/release/IBM/lunchpail.svg" alt="Latest Release"></a>
[![CI Tests](https://github.com/IBM/lunchpail/actions/workflows/tests.yml/badge.svg)](https://github.com/IBM/lunchpail/actions/workflows/tests.yml)

Lunchpail compiles your job code into an all-in-one executable. Others download that binary, and `up` it to run your code in the Cloud or an existing Kubernetes cluster. 

> [!NOTE]
> Bear with us, and please chip in if you can, as we finish up the initial polishing passes. 

<table>
    <tr>
        <td><img src="docs/demo1.gif" width="222"><br><a href="docs/demos/#openroad-demo"><tt>lunchpail-openroad up</tt></a></td>
        <td><img src="docs/status0.png" width="230"><br><a href="docs/demos/#lunchpail-demo"><tt>lunchpail-demo up</tt></a></td>
        <td><img src="docs/status1.png" width="230"><br>Commercial application</td>
    </tr>
</table>

## Getting Started

- [Try a demo](./docs/demos/README.md). We have used Lunchpail to build binaries of several demo applications.
- [Build binaries for your application](./docs/build/README.md)
- [Develop Lunchpail itself](./docs/contribute/README.md)

## User Roles

Here are some of the Lunchpail use cases, summarized by user role:

### Application Owners

Shrink-wrap and distribute code as binaries. Lunchpail bundles your code with the logic for deployment, scaling, load balancing, observability, etc.

### Platform engineers

Shrink-wrap the variants of base application logic for their team's use cases. These also become distributable binaries.

### End users and Automators

Stitch together the steps of automation, because each step is a black box shrink-wrapped application.

### Budgeters and Project Managers

Have your developers run the applications in a mode that only queues up work. Separately, one can use the same binary to allocate or reduce resources assigned to each queue, as budget allows.
