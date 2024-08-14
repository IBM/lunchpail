api=workqueue

# in pail/dispatcher.yaml we set repeat=2, so we expect the tasks to
# be repeated twice

expected=("Processing task.1.1.txt 99999999 88888888" "Processing task.1.2.txt 99999999 88888888" "Processing task.2.1.txt 99999999 88888888" "Processing task.2.2.txt 99999999 88888888" "Processing task.3.1.txt 99999999 88888888" "Processing task.3.2.txt 99999999 88888888" "Processing task.4.1.txt 99999999 88888888" "Processing task.4.2.txt 99999999 88888888" "Processing task.5.1.txt 99999999 88888888" "Processing task.5.2.txt 99999999 88888888" "Processing task.6.1.txt 99999999 88888888" "Processing task.6.2.txt 99999999 88888888")
