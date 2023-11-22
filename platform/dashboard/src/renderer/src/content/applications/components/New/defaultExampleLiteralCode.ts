const shell = `#!/usr/bin/env bash

echo "Input=$1"
echo "Processing=$2"
echo "Output=$3"
`
const python = `#!/usr/bin/env python
import sys

print(f"Input {sys.argv[1]}")
print(f"Processing {sys.argv[2]}")
print(f"Output {sys.argv[3]}")
`

export default { shell, python }
