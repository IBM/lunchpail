# Lunchpail WorkStealer

The Workstealer's duties are:

- observe new Tasks that need to be processed
- observe new Workers that have volunteered to help process Tasks
- observe death of Workers and reassign Tasks to a different Worker
- observe imbalance of Task-Worker assignment, and rebalance as needed
  to avoid Worker starvation

As it observes the creation of a new Task, the WorkStealer distributes
this Task to an available Worker. If, either Worker starvation or
Worker death is observed, the WorkStealer will reassign Tasks in order
to prevent load imbalance or orphaned Tasks.

## Operational Characteristics

The WorkStealer operates on the following directory structure.

```
└── test7e                                <---- TaskQueue name (a Dataset instance)
    └── test7e                            <---- Run name (one directory per Run that is using this TaskQueue)
        ├── inbox                         <---- directory of unassigned Tasks for this Run
        │   ├── task.1.txt                <---- one unassigned Task
        │   ├── task.1.txt.done           <---- indicates that this Task is complete
        │   ├── task.1.txt.lock           <---- indicates that this Task has been assigned to a Worker
        │   ├── task.2.txt
        │   ├── task.2.txt.done
        │   ├── task.2.txt.lock
        │   ├── task.3.txt
        │   ├── task.3.txt.done
        │   ├── task.3.txt.lock
        │   ├── task.4.txt
        │   ├── task.4.txt.done
        │   ├── task.4.txt.lock
        │   ├── task.5.txt
        │   ├── task.5.txt.done
        │   ├── task.5.txt.lock
        │   ├── task.6.txt
        │   └── task.6.txt.done
        ├── outbox                        <---- tasks fully complete by a Worker
        │   ├── task.1.txt
        │   ├── task.2.txt
        │   ├── task.3.txt
        │   ├── task.4.txt
        │   ├── task.5.txt
        │   └── task.6.txt
        └── queues                        <---- directory, one per WorkerPool assigned to this Run
            └── test7e-pool1.0            <---- {WorkerPoolName}.{WorkerIndex} assigned to this Run
                ├── inbox                 <---- assigned but unprocessed items for this WorkerPool
                └── outbox                <---- directory of completed Tasks by this Worker
                    ├── task.1.txt        <---- one completed Task by this Worker
                    ├── task.2.txt
                    ├── task.3.txt
                    ├── task.4.txt
                    └── task.5.txt
```
