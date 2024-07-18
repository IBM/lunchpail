<image align="right" alt="Lunchpail icon" src="docs/lunchpail.png" title="Lunchpail" width="64">

# Lunchpail

[![CI Tests](https://github.com/IBM/lunchpail/actions/workflows/actions.yml/badge.svg)](https://github.com/IBM/lunchpail/actions/workflows/actions.yml)

Lunchpail is a lightweight way to package and execute highly scalable
jobs.

## I am an application author

You can bundle ("shrinkwrap") your app into an `.exe` that you then
distribute to others. Users of your app then launch it. You may upload
and share the shrinkwrap with others. They need know nothing about how
to get the source, how to link with data, etc., as these concerns have
all been internalized into the shrinkwrapped app.

## I am a user of a shrinkwrapped app

When launching an app, you will be prompted to fill in some of the
"blanks" left over from the shrinkwrapping step &mdash; e.g. necessary
secrets that cannot be shared. After this, the job just runs.

## Getting Started

- [Download](https://github.ibm.com/cloud-computer/lunchpail/releases/latest) the latest `lunchpail` CLI.
- Try out `lunchpail demo`. This will generate a shrinkwrap of a demo
  app in `./lunchpail-demo`.
- Run `./lunchpail-demo/up` to launch the app.
- Run `./launchpail-demo/qstat` to monitor the task queue.
- Run `./lunchpail-demo/down` to stop the app.
