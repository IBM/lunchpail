# CodeFlare Platform Tests

## Running Tests

The [test.sh](./tests/bin/test.sh) script is the main
driver. Generally speaking, you snould not need to modify this.

```shell
./tests/bin/test.sh
```

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
create a Dockerfile under [./base-images](./base-images).
