# Getting Started: Development of the Platform

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
