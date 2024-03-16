#
# Origin:
# https://github.com/ieee-ceda-datc/aspdac-2022-tutorial/blob/main/part4-k8s-single-node-ray-demo/k8s-single-node-ray.ipynb
# "In this demo, our goal is to find a maximum achivable [sic] utilization for a given design."
#
import sys
import subprocess
from os import path, remove
from shutil import move

in_file = sys.argv[1]
processing_file = sys.argv[2]
out_file = sys.argv[3]

print(f"in_file={in_file}")

with open(in_file) as f:
    util = int(f.readline())

print(f"FP util={util}")

# 0. mark work as underway
move(in_file, processing_file)

# 1. Copy experiment template
mountpath = "/mnt/datasets/test8-templates/"
openroad_flow = path.join(mountpath, "openroad-flow")
openroad_flow_local = path.join("/tmp", "openroad-flow")
template = path.join(mountpath, "experiment-template")
workspace = path.join("/tmp", f"experiment-{util}")
subprocess.call(f"cp -r {template} {workspace}", shell=True)

if not path.isdir(openroad_flow_local):
    print("Copying openroad-flow")
    subprocess.call(f"cp -r {openroad_flow} {openroad_flow_local}", shell=True)

# 2. Change the utilization.
with open(f"{workspace}/config.mk", 'a') as f:
    f.write("\n# Experiment setup:\n")
    f.write("export CORE_UTILIZATION = {}\n".format(util))

# 3. Execute the flow
print(f"Running experiment {util}")
subprocess.call(f"make DESIGN_CONFIG=./config.mk",
                cwd=workspace,
                shell=True)

# 4. mark work as done
print("Marking work as done")
move(processing_file, out_file)

# 5. TODO somehow send real output in out_file
# subprocess.call(f"cp -r {workspace} {mountpath}", shell=True)

print(f"FP util {util} -- Done.")
