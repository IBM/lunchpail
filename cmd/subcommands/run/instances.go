//go:build full || observe

package run

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/spf13/cobra"

	"lunchpail.io/cmd/options"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/compilation"
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

	runOpts := options.AddRunOptions(cmd)
	tgtOpts := options.AddTargetOptions(cmd)
	component := options.AddComponentOption(cmd)
	cmd.MarkFlagRequired("component")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		for {
			backend, err := be.New(compilation.Options{Target: tgtOpts})
			if err != nil {
				if wait {
					waitItOut(*component, -1, err)
					continue
				}
				return err
			}

			runname := runOpts.Run
			if runname == "" {
				if r, err := util.Singleton(context.Background(), backend); err != nil {
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

			count, err := backend.InstanceCount(*component, runname)
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
