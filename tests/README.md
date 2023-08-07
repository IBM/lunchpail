# CodeFlare Platform Tests

- [./bin](./bin): test scripts
- [./tests](./tests): this directory contains the test settings for each of the tests
- [./helm](./helm): the Helm chart to deploy the test Applications, Runs, and Datasets
- [./base-images](./base-images): Extra base images needed only for test Applications

## Running Tests Locally

The [test.sh](./bin/test.sh) script is the main
driver. Generally speaking, you snould not need to modify this.

```shell
./tests/bin/test.sh
```

## Running Tests Against a Remote VM

We can currently stand up a VM in IBM Cloud, ship the current clone to
that VM, and then run the tests "locally" in that remote VM. For this,
you will need secrets, e.g. IBM Cloud apikey and a few other
bits. Contact `nickm@us.ibm.com`.

```shell
./tests/bin/ibmcloud-gpu.sh [-i]
```

By passing `-i` only the VM provisioning will take place. Then, you
can ssh into the VM and interact with it directly. Without `-i`, the
tests will also be run; when complete, the script will automatically
tear down and deprovision the VM.

## Adding a new Test

1) Define the application and run yamls under
[./helm/templates/applications](./helm/templates/applications). Say you name the application "foo".

2) Define the expected output under the [./tests](./tests)
directory. Create a file `./foo/settings.sh`. The settings.sh file
minimally must define the expected log output, e.g.

```shell
expected=('Expected line 1' 'Expected line 2')
```

You may also set `api=ray`, please do this if your application uses
the Ray APIs. If your app and run yamls are not situated in the
default `codeflare-test` namespace, also define `namespace=...` in
your settings.sh. If the name of those resources does not match the
name under `./tests/foo` (say the app and run resources are named
"bar"), then also make sure to define `testname=bar`.

3) [Optional] If your test Application needs a custom base image,
create a Dockerfile under [./base-images](./base-images). Any
directories with Dockerfiles will be built and loaded into the cluster
as part of `./hack/build.sh` (which is called as part of
`./hack/up.sh`).
