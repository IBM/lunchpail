# Lunchpail library routines

- **build**: Manages state of built application, e.g. build name, build date, and preconfigured options.

- **be**: Backend logic that takes llir (low-level intermediate representation) and stands it up.

- **boot**: Wrapper logic to handle up/down semantics.

- **fe**: Frontend logic that takes source and produces hlir (high-level intermediate representation).

- **ir**: Divided into hlir and llir. Just models and model interrogation routines here.

- **lunchpail**: Logic that is specific to running and developing Lunchpail itself.

- **observe**: Logic to observe a running application.

- **util**: Generic helper routines.
