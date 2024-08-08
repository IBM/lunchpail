# Frontend (fe)

- **compiler**: Collects application source and options and generates
  an executable that encapsulates these. This stage does no
  interpretation of either source or options, it merely serves to
  bundle the two.
  
- **parser**: Transforms application source to HLIR (high-level
  intermediate representation).
  
- **linker**: Collects the final set of configuration parameters
  relevant to running the compiled application in a particular
  location, for a particular user, etc.

- **transformer**: Lowers HLIR to LLIR (low-level intermediate
  representation) based on the configuration collected by the linker.
