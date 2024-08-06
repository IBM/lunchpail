# Lunchpail: Development of Lunchpail Itself

Welcome, and thanks for you interest in contributing to Lunchpail. 

## Step 1: Fork the Repository

Fork the repository and submit all work as pull requests from a branch
on your fork. If you are not quite ready for a full review, you can
mark the pull request as Draft. If ready for a review and merge,
please squash all of your commits down to a single commit.

We appreciate your using [conventional
commit](https://www.conventionalcommits.org/en/v1.0.0/) messages where
each PR'd commit (and the PR itself) has a title prefix of `feat: ` or
`fix: ` or `chore: ` or `refactor: ` or `doc: `. Thanks!

## Step 2: Build the CLI

It will be helpful to have a local build of the CLI:

```shell
./hack/setup/cli.sh
```

This will build `./lunchpail` for your current OS and architecture. If
you want to test on other platforms, use the `cli-all.sh` command
instead. You may provide an output path via e.g. `cli.sh
/tmp/lunchpail`.

## Step 3: Initialize Podman

Currently, local development requires a container runtime and
Kubernetes cluster. If you do not already have these set up on your
laptop, you may run:

```shell
./lunchpail init local --build-images
```

This will install [Podman](https://podman.io/), create a Podman
machine, install [Kind](https://github.com/kubernetes-sigs/kind), and
create a Kind cluster named `lunchpail`. Later, if you only want to
test rebuilding the images:

```shell
./lunchpail images build --verbose
```

Be careful about passing `--production` to this command, as this will
result in images being pushed to the default image repository.

## Step 4: Compile and Run a Demo

Now you can compile your first application:

```shell
./lunchpail assemble https://github.com/IBM/lunchpail-demo -o demo -N
```

And try it out!

```shell
./demo up
```

This will start the application and also launch the status
dashboard. If you only want to launch the application, run with
`--watch=false`. Later, you can run `./demo status` to see the status
of the current run.

To stop a run, issue

```shell
./demo down
```

## Step 5: Run a Test

After making a change, you can run a test, e.g.:

```shell
./tests/bin/rerun.sh tests/tests/test7f
```

The "re" part of `rerun.sh` means that all of the above steps will be
repeated. This includes rebuiding base images (which is included in
`lunchpail init local --build-images` or `./lunchpail images build`)
and rebuilding the CLI.
