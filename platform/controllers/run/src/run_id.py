import os
import random
import string

# TODO api should be an enum?
def alloc_run_id(api, name: str):
    # Note: we trim `run_id` to 53 chars, to make a kubernetes
    # (especially helm install) friendly name. Also, kubernetes
    # resources cannot end in a dash.

    rando = ''.join(random.choice(string.ascii_lowercase) for i in range(12))
    run_id =  f"{api}-{name}-{rando}"[:53].rstrip("-")
    workdir = os.path.join(os.environ.get("WORKDIR"), run_id)

    return run_id, workdir
