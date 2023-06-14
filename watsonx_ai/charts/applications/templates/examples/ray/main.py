import ray
import numpy as np

from qiskit.opflow import Z, I, X
from qiskit.providers.basicaer import QasmSimulatorPy
from qiskit.utils import QuantumInstance
from qiskit.algorithms import VQE
from qiskit.circuit.library import TwoLocal
from qiskit.algorithms.optimizers import SLSQP
from qiskit.providers import Backend

import sys
print(sys.argv[1:])

@ray.remote
class Counter:
    def __init__(self):
        self.value = 0

    def increment(self):
        self.value += 1
        return self.value

    def get_counter(self):
        return self.value

    def progress(self, N):
        return f"{round((self.value / N) * 100)}%"

@ray.remote
def prep_problem():
    """Prepare demo problem."""
    op = (
        (-1.052373245772859 * I ^ I)
        + (0.39793742484318045 * I ^ Z)
        + (-0.39793742484318045 * Z ^ I)
        + (-0.01128010425623538 * Z ^ Z)
        + (0.18093119978423156 * X ^ X)
    )
    initial_state = np.random.random(8)
    var_form = TwoLocal(
        rotation_blocks="ry", 
        entanglement_blocks="cz"
    )
    
    return (op, var_form, initial_state)

@ray.remote
def optimize(problem, number_of_trials, counter):
    """Optimization demo routine."""
    backend = QasmSimulatorPy()
    
    op, var_form, init_point = problem
    
    qi = QuantumInstance(backend, seed_transpiler=42, seed_simulator=42)
    ansatz = TwoLocal(rotation_blocks="ry", entanglement_blocks="cz")
    slsqp = SLSQP(maxiter=100)

    vqe = VQE(
        var_form,
        optimizer=slsqp,
        quantum_instance=qi,
        initial_point=init_point
    )
    result = vqe.compute_minimum_eigenvalue(op)

    counter.increment.remote()
    print(f"Epoch 0: {ray.get(counter.progress.remote(number_of_trials))}")
    
    print(f"Optimization result:")
    print(f" - eigenvalue: {result.eigenvalue}")
    print(f" - optimal value: {result.optimal_value}")
    print(f" - optinal parameters: {result.optimal_parameters}")
    
    return result

@ray.remote
def analyze(results):
    """Analyzing demo results."""
    return min(results, key=lambda r: r.eigenvalue.real)
    
    
if __name__ == "__main__":
    with ray.init():
        number_of_trials = 30

        # Create an actor from this class.
        counter = Counter.remote()
        
        workflow_graph = analyze.remote(
            results=ray.get([
                optimize.remote(
                    problem=prep_problem.remote(),
                    number_of_trials=number_of_trials,
                    counter=counter
                )
                for _ in range(number_of_trials)
            ])
        )

        result = ray.get(workflow_graph)
        print(f"Final result:")
        print(f" - eigenvalue: {result.eigenvalue}")
        print(f" - optimal value: {result.optimal_value}")
        print(f" - optinal parameters: {result.optimal_parameters}")
