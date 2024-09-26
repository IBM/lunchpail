//go:build full || observe

package runs

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/lunchpail"
)

func Instances() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "instances",
		Short: "Report the number of instances of a given component",
		Args:  cobra.MatchAll(cobra.ExactArgs(0), cobra.OnlyValidArgs),
	}

	var wait bool
	var quiet bool
	cmd.Flags().BoolVarP(&wait, "wait", "w", false, "Wait for at least one instance to be ready")
	cmd.Flags().BoolVarP(&quiet, "quiet", "q", false, "Only respond via exit code")

	opts, err := options.RestoreBuildOptions()
	if err != nil {
		panic(err)
	}

	runOpts := options.AddRunOptions(cmd)
	options.AddTargetOptionsTo(cmd, &opts)

	component := options.AddComponentOption(cmd)
	cmd.MarkFlagRequired("component")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		for {
			backend, err := be.New(ctx, opts)
			if err != nil {
				if wait {
					waitItOut(*component, -1, err)
					continue
				}
				return err
			}

			ctx := context.Background()
			runname := runOpts.Run
			if runname == "" {
				if r, err := util.Singleton(ctx, backend); err != nil {
					if wait {
						waitItOut(*component, -1, err)
						continue
					}
					if strings.Contains(err.Error(), "No runs found") {
						fmt.Println("0")
						return nil
					}
					return err
				} else {
					runname = r.Name
				}
			}

			count, err := backend.InstanceCount(ctx, *component, runname)
			if err != nil {
				if wait {
					waitItOut(*component, -1, err)
					continue
				}
				return err
			} else if wait && count == 0 {
				waitItOut(*component, count, nil)
				continue
			}

			if !quiet {
				fmt.Printf("%d\n", count)
			}
			break
		}

		return nil
	}

	return cmd
}

func waitItOut(c lunchpail.Component, sofar int, err error) {
	fmt.Printf("Waiting for an instance of %v to be ready count=%d err=%v\n", c, sofar, err)
	time.Sleep(1 * time.Second)
}
