package shrinkwrap

import (
	"bufio"
	"context"
	"fmt"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"
	"golang.org/x/sync/errgroup"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"lunchpail.io/pkg/lunchpail"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type QstatOptions struct {
	Namespace string
	Follow    bool
	Tail      int64
	Verbose   bool
}

type Worker struct {
	Name       string
	Inbox      int
	Processing int
	Outbox     int
	Errorbox   int
}

type QstatModel struct {
	Valid       bool
	Timestamp   string
	Unassigned  int
	Assigned    int
	Processing  int
	Success     int
	Failure     int
	LiveWorkers []Worker
	DeadWorkers []Worker
}

func stream(namespace string, follow bool, tail int64, c chan QstatModel) error {
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

	pods, err := clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{LabelSelector: "app.kubernetes.io/component=workstealer"})
	if err != nil {
		return err
	} else if len(pods.Items) == 0 {
		return fmt.Errorf("Workstealer not found in namespace=%s\n", namespace)
	} else if len(pods.Items) > 1 {
		return fmt.Errorf("Multiple Workstealers found in namespace=%s\n", namespace)
	}

	podLogs := clientset.CoreV1().Pods(namespace).GetLogs(pods.Items[0].Name, &opts)
	stream, err := podLogs.Stream(context.TODO())
	if err != nil {
		return err
	}
	buffer := bufio.NewReader(stream)

	var model QstatModel = QstatModel{false, "", 0, 0, 0, 0, 0, []Worker{}, []Worker{}}
	for {
		line, err := buffer.ReadString('\n')
		if err != nil { // == io.EOF {
			break
		}

		if !strings.HasPrefix(line, "lunchpail.io") {
			continue
		}

		fields := strings.Fields(line)
		if len(fields) >= 3 {
			marker := fields[1]
			count, err := strconv.Atoi(fields[2])
			if err != nil {
				continue
			}

			if marker == "unassigned" {
				if model.Valid {
					c <- model
					model = QstatModel{true, "", 0, 0, 0, 0, 0, []Worker{}, []Worker{}}
				}
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

				if marker == "liveworker" {
					model.LiveWorkers = append(model.LiveWorkers, worker)
				} else {
					model.DeadWorkers = append(model.DeadWorkers, worker)
				}
			}
		}
	}

	return nil
}

func QstatStreamer(opts QstatOptions) (chan QstatModel, *errgroup.Group, error) {
	namespace := lunchpail.AssembledAppName()
	if opts.Namespace != "" {
		namespace = opts.Namespace
	}

	c := make(chan QstatModel)

	errs, _ := errgroup.WithContext(context.Background())
	errs.Go(func() error {
		err := stream(namespace, opts.Follow, opts.Tail, c)
		close(c)
		return err
	})

	return c, errs, nil
}

func Qstat(opts QstatOptions) error {
	c, errs, err := QstatStreamer(opts)
	if err != nil {
		return err
	}

	purple := lipgloss.Color("99")
	re := lipgloss.NewRenderer(os.Stdout)
	headerStyle := re.NewStyle().Foreground(purple).Bold(true).Align(lipgloss.Center)

	first := true
	for model := range c {
		if !first {
			fmt.Println()
		} else {
			first = false
		}

		t := table.New().
			Border(lipgloss.NormalBorder()).
			BorderStyle(lipgloss.NewStyle().Foreground(purple)).
			Width(80).
			Headers("", "IDLE", "WORKING", "SUCCESS", "FAILURE").
			StyleFunc(func(row, col int) lipgloss.Style {
				var style lipgloss.Style

				switch {
				case row == 0:
					return headerStyle
				}
				return style
			})

		t.Row("unassigned", strconv.Itoa(model.Unassigned), "", "", "")
		t.Row("assigned", strconv.Itoa(model.Assigned), "", "", "")
		t.Row("processing", "", strconv.Itoa(model.Processing), "", "")
		t.Row("done", "", "", strconv.Itoa(model.Success), strconv.Itoa(model.Failure))

		for _, worker := range model.LiveWorkers {
			t.Row(worker.Name, strconv.Itoa(worker.Inbox), strconv.Itoa(worker.Processing), strconv.Itoa(worker.Outbox), strconv.Itoa(worker.Errorbox))
		}
		for _, worker := range model.DeadWorkers {
			t.Row(worker.Name+"☠", strconv.Itoa(worker.Inbox), strconv.Itoa(worker.Processing), strconv.Itoa(worker.Outbox), strconv.Itoa(worker.Errorbox))
		}

		fmt.Printf("%s\tWorkers: %d\n", model.Timestamp, len(model.LiveWorkers))
		fmt.Println(t.Render())
	}

	return errs.Wait()
}
