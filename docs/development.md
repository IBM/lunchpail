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

### Launching Runs for Manual Testing

Test Run resource specs are located in
[tests/helm/applications](tests/helm/applications). To stand them all
up, you can use `./tests/bin/deploy-tests.sh`, or you can deploy a
specific test by passing the name of the test as an argument to that
script.

### Running Automated Tests

```shell
./tests/bin/test.sh
```

This will run through all of the tests.

## Debugging the Controllers

The controllers will be visible in logs and events associated with
these resources:

```shell
kubectl get pod -n codeflare-system -w
```
