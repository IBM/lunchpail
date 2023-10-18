# Jobs as Service Client

An Electron application that provides a client-side user experience
for Jobs as a Service.

## Development

First, make sure you have a recent version of
[NodeJS](https://nodejs.org/en) and
(Yarn)(https://classic.yarnpkg.com/lang/en/docs/install) installed on
your laptop. Then:

```bash
# This will install the dependencies
$ yarn
```

```bash
# This will launch a watcher and open an Electron window
$ yarn dev
```

### Production Builds

To make production double-clickable builds, use the following commands:

```bash
# For windows
$ yarn build:win

# For macOS
$ yarn build:mac

# For Linux
$ yarn build:linux
```

On macOS, the builds will be signed and notarized only if you have an
Apple Developer ID, an app-specific password, etc.
