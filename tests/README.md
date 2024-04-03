# Platform Tests

- [./bin](./bin): test scripts
- [./tests](./tests): this directory contains the test settings for each of the tests
- [./helm](./helm): the Helm chart to deploy the test Applications, Runs, and Datasets
- [./base-images](./base-images): Extra base images needed only for test Applications

## Running Tests Locally

There are two scripts here you should use: [run.sh](./bin/run.sh) and
[rerun.sh](./bin/rerun.sh). The `run.sh` is useful if you already have
the core running, as it will quickly get the test running, without
altering the core deployment. The `rerun.sh` is useful if you want to
test an update to the core. It will redeploy the core, and then invoke
`run.sh`.

## Adding a new Test

1) Add a directory under [./tests](./tests) named for your test. Say
your test is named `foo`.

2) Define the expected output under the `./tests/foo/settings.sh` The
settings.sh file minimally must define the expected log output, e.g.

```shell
expected=('Expected line 1' 'Expected line 2')
```

You may also set `api=ray`, please do this if your application uses
the Ray APIs. If your app and run yamls are not situated in the
default test namespace, also define `namespace=...` in your
settings.sh. If the name of those resources does not match the name
under `./tests/foo` (say the app and run resources are named "bar"),
then also make sure to define `testname=bar`.
