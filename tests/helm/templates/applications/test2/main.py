import os
import ray

if __name__ == "__main__":
    with ray.init():

        if os.path.isdir("/mnt/datasets"):
            print("PASS: datashim outer mount is a directory")
        else:
            print("FAIL: datashim outer mount is NOT a directory")
            exit(1)

        if os.path.isdir("/mnt/datasets/test-dataset-s3"):
            print("PASS: datashim mount of s3-test is a directory")
        else:
            print("FAIL: datashim mount of s3-test is NOT a directory")
            exit(1)

        ray.shutdown()
        exit(0)
