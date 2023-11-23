const shell = `#!/usr/bin/env bash

echo "Input=$1" # Task input filepath
echo "Processing=$2" # Move file here when Processing begins
echo "Output=$3" # Task output filepath`

const python = `import sys

print(f"Input {sys.argv[1]}") # Task input filepath
print(f"Processing {sys.argv[2]}") # Move file here when Processing begins
print(f"Output {sys.argv[3]}") # Task output filepath`

export default { shell, python }
