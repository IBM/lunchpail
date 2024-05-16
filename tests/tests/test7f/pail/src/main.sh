#!/usr/bin/env bash

set -e
set -o pipefail

echo -n "Started TaskDispatcher method=$METHOD "
if [[ $METHOD = tasksimulator ]]
then echo "injectedTasksPerInterval=$TASKS intervalSeconds=$INTERVAL"
elif [[ $METHOD = parametersweep ]]
then echo "min=$SWEEP_MIN max=$SWEEP_MAX step=$SWEEP_STEP"
fi

# test injected values from -f values.yaml
# taskprefix2 can be used to test that e.g. numerical values are processed correctly
if [[ -n "$taskprefix" ]]
then taskprefix=${taskprefix}${taskprefix2}
else taskprefix=task
fi
echo "got value taskprefix=$taskprefix"

printenv

config=/tmp/rclone.conf
remote=s3:/${!TASKQUEUE_VAR}/$LUNCHPAIL/$RUN_NAME/inbox
cat <<EOF > $config
[s3]
type = s3
provider = Other
env_auth = false
endpoint = ${!S3_ENDPOINT_VAR}
access_key_id = ${!AWS_ACCESS_KEY_ID_VAR}
secret_access_key = ${!AWS_SECRET_ACCESS_KEY_VAR}
acl = public-read
EOF

# how many tasks we've injected so far; it is useful to keep the
# filename of tasks consistent, so that tests can look for a
# deterministic set of tasks
idx=0

if [[ $METHOD = parametersweep ]]
then
  for parameter_value in $(seq $SWEEP_MIN $SWEEP_STEP $SWEEP_MAX)
  do
    task=/tmp/${taskprefix}.${idx}.txt
    idx=$((idx + 1))

    echo "Injecting task=$task parameter_value=${parameter_value}"
    echo -n ${parameter_value} > $task

    rclone --config $config sync $PROGRESS $task $remote
    rm -f "$task"
  done

  exit
fi

# otherwise tasksimulator
if [[ -n "$COLUMNS" ]] && [[ -n "$COLUMN_TYPES" ]]
then echo "Using schema columns=\"$COLUMNS\" columnTypes=\"$COLUMN_TYPES\""
fi

while true
do
  for i in $(seq 1 $TASKS)
  do
    task=/tmp/${taskprefix}-$(cat /proc/sys/kernel/random/uuid).txt
    echo "Injecting task=$task format=${FORMAT-generic}"

    if [[ $FORMAT = parquet ]] && [[ -n "$COLUMNS" ]] && [[ -n "$COLUMN_TYPES" ]]
    then
      # Simulated parquet task
      echo "Simulating a parquet task"
      echo "$COLUMNS" | tr " " "," > $task # csv column header

      # for each row
      for j in $(seq 1 ${NROWS_PER_TASK-10})
      do
        # for each column
        IDX=0
        for type in $COLUMN_TYPES
        do
          case $type in
            number)
              VAL=$RANDOM
              ;;
            string)
              VAL="Lorem ipsum dolor sit amet consectetur adipiscing elit. Vestibulum pharetra eros lectus. Nulla bibendum ligula sapien non pellentesque urna vestibulum eu. Duis ut eleifend sem. Nam eget diam euismod lacinia massa quis vestibulum nulla. Aliquam porttitor egestas interdum. Morbi eu porttitor velit. Pellentesque habitant morbi tristique senectus et netus et."
              ;;
            *)
              VAL="null"
              ;;
          esac

          if [[ $IDX != 0 ]]; then echo -n "," >> $task; fi
          echo -n "$VAL" >> $task

          IDX=$((IDX + 1))
        done
        echo "" >> $task # end the line
      done
      #parquet convert-csv $task -o ${task}.parquet
      python -c "import pandas as pd; pd.read_csv('$task').to_parquet('$task.parquet')"
      # python -c 'import pandas as pd; pd.read_csv("/tmp/foo.csv").to_parquet("/tmp/foo.parquet")'
      otask="$task"
      task="${task}.parquet"
      rm -f "$otask"
    else
      echo "Simulated generic task" > $task
    fi

    rclone --config $config sync $PROGRESS $task $remote
    rm -f "$task"
  done

  sleep ${INTERVAL-5}
done

echo "Exiting"
sleep infinity
