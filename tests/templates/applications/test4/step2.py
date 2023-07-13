import ray

def main(
    a: float = 1.0,
    b: float = 7.0,
):
    return a - b

with ray.init():
    main()
    print("Done")
