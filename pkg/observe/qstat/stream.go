package qstat

import (
	"bufio"
	"context"
	"fmt"
	"golang.org/x/sync/errgroup"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/fe/transformer/api"
	"os"
	"slices"
	"strconv"
	"strings"
	"time"
)

func streamModel(runname, namespace string, follow bool, tail int64, quiet bool, c chan Model) error {
	opts := v1.PodLogOptions{Follow: follow}
	if tail != -1 {
		opts.TailLines = &tail
	}

	clientset, _, err := kubernetes.Client()
	if err != nil {
		return err
	}

	pods, err := clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{LabelSelector: "app.kubernetes.io/component=workstealer,app.kubernetes.io/instance=" + runname})
	if err != nil {
		return err
	} else if len(pods.Items) == 0 {
		return fmt.Errorf("Cannot find run in namespace=%s\n", namespace)
	} else if len(pods.Items) > 1 {
		return fmt.Errorf("Multiple matching runs found in namespace=%s\n", namespace)
	}

	podLogs := clientset.CoreV1().Pods(namespace).GetLogs(pods.Items[0].Name, &opts)
	stream, err := podLogs.Stream(context.TODO())
	if err != nil {
		if strings.Contains(err.Error(), "waiting to start") {
			if !quiet {
				fmt.Fprintf(os.Stderr, "Waiting for app to start...\n")
			}
			time.Sleep(2 * time.Second)
			// TODO update this to use the kubernetes watch api?
			return streamModel(runname, namespace, follow, tail, quiet, c)
		} else {
			return err
		}
	}
	buffer := bufio.NewReader(stream)

	var model Model = Model{false, "", 0, 0, 0, 0, 0, []Pool{}}
	for {
		line, err := buffer.ReadString('\n')
		if err != nil { // == io.EOF {
			break
		}

		if !strings.HasPrefix(line, "lunchpail.io") {
			continue
		}

		fields := strings.Fields(line)
		if len(fields) == 0 {
			continue
		}

		marker := fields[1]
		if marker == "---" && model.Valid {
			c <- model
			model = Model{true, "", 0, 0, 0, 0, 0, []Pool{}}
			continue
		} else if len(fields) >= 3 {
			count, err := strconv.Atoi(fields[2])
			if err != nil {
				continue
			}

			if marker == "unassigned" {
				model.Valid = true
				model.Unassigned = count
				model.Timestamp = strings.Join(fields[4:], " ")
			} else if marker == "assigned" {
				model.Assigned = count
			} else if marker == "processing" {
				model.Processing = count
			} else if marker == "done" {
				count2, err := strconv.Atoi(fields[3])
				if err != nil {
					continue
				}

				model.Success = count
				model.Failure = count2
			} else if marker == "liveworker" || marker == "deadworker" {
				count2, err := strconv.Atoi(fields[3])
				if err != nil {
					continue
				}
				count3, err := strconv.Atoi(fields[4])
				if err != nil {
					continue
				}
				count4, err := strconv.Atoi(fields[5])
				if err != nil {
					continue
				}

				// The workstealer labels workers with
				// the suffix of the queue path that
				// we gave it via
				// api.QueuePrefixPathForWorker(). See
				// e.g. `assignedWorkPattern`. Here,
				// we reverse that to extract the
				// worker and pool name.
				poolName, workerName, err := api.ExtractNamesFromSubPathForWorker(fields[6])
				if err != nil {
					continue
				}

				worker := Worker{
					workerName, count, count2, count3, count4,
				}

				pidx := slices.IndexFunc(model.Pools, func(pool Pool) bool { return pool.Name == poolName })
				var pool Pool
				if pidx < 0 {
					// new pool
					pool = Pool{poolName, []Worker{}, []Worker{}}
				} else {
					pool = model.Pools[pidx]
				}

				if marker == "liveworker" {
					pool.LiveWorkers = append(pool.LiveWorkers, worker)
				} else {
					pool.DeadWorkers = append(pool.DeadWorkers, worker)
				}

				if pidx < 0 {
					model.Pools = append(model.Pools, pool)
				} else {
					model.Pools = slices.Concat(model.Pools[:pidx], []Pool{pool}, model.Pools[pidx+1:])
				}
			}
		}
	}

	return nil
}

func QstatStreamer(runname, namespace string, opts Options) (chan Model, *errgroup.Group, error) {
	c := make(chan Model)

	errs, _ := errgroup.WithContext(context.Background())
	errs.Go(func() error {
		err := streamModel(runname, namespace, opts.Follow, opts.Tail, opts.Quiet, c)
		close(c)
		return err
	})

	return c, errs, nil
}
