# Lunchpail: Getting Started as an Application Developer

- [Download](https://github.com/IBM/lunchpail/releases/latest) the latest `lunchpail` CLI.
- Try out `lunchpail compile` to generate binaries for your application.

## Usage of `lunchpail compile`

```shell
❯ ./lunchpail compile -h
Generate a binary specialized to a given application

Usage:
  lunchpail compile path-or-git [flags]

Flags:
  -A, --all-platforms              Generate binaries for all supported platform/arch combinations
  -b, --branch string              Git branch to pull from
  -N, --create-namespace           Create a new namespace, if needed
  -s, --image-pull-secret string   Of the form <user>:<token>@ghcr.io
  -n, --namespace string           Kubernetes namespace to deploy to
  -t, --openshift                  Include support for OpenShift
  -o, --output string              Path to store output binary
      --queue string               Use the queue defined by this Secret (data: accessKeyID, secretAccessKey, endpoint)
  -r, --repo-secret strings        Of the form <user>:<pat>@<githubUrl> e.g. me:3333@https://github.com
      --set strings                [Advanced] override specific template values
  -p, --target-platform Platform   Backend platform for deploying lunchpail [Kubernetes, IBMCloud, Skypilot] (default Kubernetes)
  -d, --debug                      Debug output
  -v, --verbose                    Verbose output
```
      
## Example of `lunchpail compile`

```shell
lunchpail compile https://github.com/IBM/lunchpail-demo -o /tmp/lunchpail-demo -N
```

Here, we used the `-N` flag (short for `--create-namespace`) so that
users of the demo won't have to worry about managing namespaces.
Optionally, if you add the `-A` option, a set of platform binaries
will be generated. Without that flag, a single binary for the current
platform will be generated.
