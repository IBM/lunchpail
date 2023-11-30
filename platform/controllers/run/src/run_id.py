import os
import random
import string

# TODO api should be an enum?
def alloc_run_id(api, name: str):
    rando = ''.join(random.choice(string.ascii_lowercase) for i in range(12))
    run_id =  f"{api}-{name}-{rando}"
    workdir = os.path.join(os.environ.get("WORKDIR"), run_id)

    # we trim to 53 chars, to make a kubernetes (especially helm
    # install) friendly name
    return run_id[:53], workdir
