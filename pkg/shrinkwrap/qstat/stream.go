package qstat

import (
	"bufio"
	"context"
	"fmt"
	"golang.org/x/sync/errgroup"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"
)

func streamModel(runname, namespace string, follow bool, tail int64, c chan Model) error {
	opts := v1.PodLogOptions{Follow: follow}
	if tail != -1 {
		opts.TailLines = &tail
	}

	kubeconfig := filepath.Join(os.Getenv("HOME"), ".kube", "config")
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return err
	}

	clientset, err := kubernetes.NewForConfig(config)
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
			fmt.Fprintf(os.Stderr, "Waiting for app to start...\n")
			time.Sleep(2 * time.Second)
			// TODO update this to use the kubernetes watch api?
			return streamModel(runname, namespace, follow, tail, c)
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
				name := fields[6]

				worker := Worker{
					name, count, count2, count3, count4,
				}

				poolName := poolName(worker)
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

func poolName(worker Worker) string {
	// test7f-pool1.w0.w96bh -> test7f-pool1
	if idx := strings.Index(worker.Name, "."); idx < 0 {
		// TODO error handling here. what do we want to do?
		return "INVALID: " + worker.Name
	} else {
		return worker.Name[:idx]
	}
}

func QstatStreamer(runname, namespace string, opts Options) (chan Model, *errgroup.Group, error) {
	c := make(chan Model)

	errs, _ := errgroup.WithContext(context.Background())
	errs.Go(func() error {
		err := streamModel(runname, namespace, opts.Follow, opts.Tail, c)
		close(c)
		return err
	})

	return c, errs, nil
}
