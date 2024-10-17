package options

import "github.com/spf13/cobra"

type RunOptions struct {
	Run string
}

func AddRunOptions(cmd *cobra.Command) *RunOptions {
	options := RunOptions{}
	cmd.Flags().StringVarP(&options.Run, "run", "r", "", "Inspect the given run, defaulting to using the singleton run")
	return &options
}

func AddRequiredRunOptions(cmd *cobra.Command) *RunOptions {
	opts := AddRunOptions(cmd)
	cmd.MarkFlagRequired("run")
	return opts
}

type BucketAndRunOptions struct {
	Run    string
	Bucket string
}

func AddBucketAndRunOptions(cmd *cobra.Command) *BucketAndRunOptions {
	options := BucketAndRunOptions{}
	cmd.Flags().StringVarP(&options.Run, "run", "r", "", "Inspect the given run, defaulting to using the singleton run")
	cmd.Flags().StringVar(&options.Bucket, "bucket", "", "Use the given S3 bucket")
	cmd.MarkFlagRequired("run")
	cmd.MarkFlagRequired("bucket")
	return &options
}
