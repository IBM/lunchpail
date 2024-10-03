Source: https://github.com/IBM/data-prep-kit/tree/dev/transforms/language/pii_redactor/python

In [src/](pail/src/) everything except [main.py](pail/src/main.py) is unchanged from that repo. The [main.py](pail/src/main.py) is extracted from [pii_redactor_transform.py](https://github.com/IBM/data-prep-kit/blob/dev/transforms/language/pii_redactor/python/src/pii_redactor_transform.py).

With regards to test-data:
- The [sm](pail/tests-data/sm) is unchanged from [the original](https://github.com/IBM/data-prep-kit/tree/dev/transforms/language/pii_redactor/python/test-data/input). We have added an expected output that seems to be missing from the original repository.
- The [xs](pail/tests-data/xs) is extracted (unchanged) from [this original](https://github.com/IBM/data-prep-kit/blob/dev/transforms/language/pii_redactor/python/test/test_data.py). In this case, both input and expected output were provided.
