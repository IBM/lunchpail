import os
import sys
import time

# $1 input filepath
# $2 output filepath
input=sys.argv[1]
output=sys.argv[2]

print(f"Processing {os.path.basename(input)}")
time.sleep(1)

print(f"Done with {os.path.basename(input)}")
