# Helm chart for Run with Application api=workqueue

This chart has two aims:

- Launch the **WorkStealer**, which will divvy up tasks to workers in
  WorkerPools that are associated with this **Run**.
- If needed, create a **Dataset** to represent the queues for this
  Run. If `spec.internal.queue` is provided in the **Run** spec, then
  a new queue will not be created. Instead, this **Run** will use the
  specified **Dataset** for the queues.

## Structure of Helm templates

```shell
workqueue/templates/
├── workstealer/ <-- the WorkStealer
│   ├── containers/
│   │   └── workstealer.yaml <-- the WorkStealer job's container
│   ├── appwrapper.yaml
│   └── job.yaml
└── taskqueue.yaml <-- the task queue Dataset
```
