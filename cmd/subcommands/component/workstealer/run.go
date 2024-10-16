package workstealer

import (
	"context"
	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/runtime/workstealer"
)

func Run() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "run",
		Short: "Run a work stealer",
		Long:  "Run a work stealer",
		Args:  cobra.MatchAll(cobra.ExactArgs(0), cobra.OnlyValidArgs),
	}

	bucket := ""
	listenPrefix := ""
	unassigned := ""
	outbox := ""
	finished := ""
	alldone := ""
	workerInbox := ""
	workerProcessing := ""
	workerOutbox := ""
	workerKillfile := ""

	cmd.Flags().StringVar(&bucket, "bucket", "", "Which S3 bucket to use")
	cmd.MarkFlagRequired("bucket")

	cmd.Flags().StringVar(&listenPrefix, "listen-prefix", "", "Which S3 listen-prefix to use")
	cmd.MarkFlagRequired("listen-prefix")

	cmd.Flags().StringVar(&unassigned, "unassigned", "", "Where to find unassigned tasks")
	cmd.MarkFlagRequired("unassigned")

	cmd.Flags().StringVar(&outbox, "outbox", "", "Where to find outbox tasks")
	cmd.MarkFlagRequired("outbox")

	cmd.Flags().StringVar(&finished, "finished", "", "Where to find finished tasks")
	cmd.MarkFlagRequired("finished")

	cmd.Flags().StringVar(&alldone, "all-done", "", "Where to place the final kill file")
	cmd.MarkFlagRequired("all-done")

	cmd.Flags().StringVar(&workerInbox, "worker-inbox-base", "", "Where to find workerInbox tasks")
	cmd.MarkFlagRequired("worker-inbox-base")
	cmd.Flags().StringVar(&workerProcessing, "worker-processing-base", "", "Where to find workerProcessing tasks")
	cmd.MarkFlagRequired("worker-processing-base")
	cmd.Flags().StringVar(&workerOutbox, "worker-outbox-base", "", "Where to find workerOutbox tasks")
	cmd.MarkFlagRequired("worker-outbox-base")
	cmd.Flags().StringVar(&workerKillfile, "worker-killfile-base", "", "Where to find worker killfile")
	cmd.MarkFlagRequired("worker-killfile-base")

	lopts := options.AddLogOptions(cmd)
	ropts := options.AddRequiredRunOptions(cmd)

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		return workstealer.Run(context.Background(), workstealer.Spec{RunName: ropts.Run, Bucket: bucket, ListenPrefix: listenPrefix, Unassigned: unassigned, Outbox: outbox, Finished: finished, WorkerInbox: workerInbox, WorkerProcessing: workerProcessing, WorkerOutbox: workerOutbox, WorkerKillfile: workerKillfile, AllDone: alldone}, *lopts)
	}

	return cmd
}
