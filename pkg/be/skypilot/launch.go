package skypilot

import (
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"time"

	"github.com/IBM/vpc-go-sdk/vpcv1"
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/ir/llir"
	comp "lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/util"
)

type Action string

const (
	Launch Action = "launch"
	Stop   Action = "stop"
	Down   Action = "down"
)

func launchSkyCluster(vpcService *vpcv1.VpcV1, name string, ir llir.LLIR, zone string, profile string, imageID string) error {
	t1s := time.Now()
	// One Component for WorkStealer, one for Dispatcher, and each per WorkerPool
	for i, c := range ir.Components {
		skycmd := "launch --yes"
		if i > 0 {
			skycmd = "exec"
		}
		if c.Name == comp.DispatcherComponent || c.Name == comp.WorkStealerComponent {
			appYamlString, err := ir.MarshalComponentArray(c)
			if err != nil {
				return fmt.Errorf("failed to marshall yaml: %v", err)
			}

			f, err := os.Create("app.yaml")
			if err != nil {
				return err
			}

			defer f.Close()
			_, err = f.WriteString(appYamlString)
			if err != nil {
				return err
			}

			cmdStr := "env DOCKER_HOST=unix:///var/run/docker.sock docker exec sky sky " + skycmd + " -c " + name + " --workdir . --cloud ibm --num-nodes 1" +
				" --zone " + zone + " --image-id " + imageID + " --instance-type " + profile + " --env SKYPILOT_DEBUG=1" +
				" \"kubectl apply -f app.yaml\""
			fmt.Println(strconv.Itoa(i) + ":" + cmdStr)
			cmd := exec.Command("/bin/bash", "-c", cmdStr)
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			if err := cmd.Run(); err != nil {
				return fmt.Errorf("internal Error running SkyPilot cmd: %v", err)
			}
		} else if c.Name == comp.WorkersComponent {
			workerCount := int32(0)
			for _, j := range c.Jobs {
				workerCount = workerCount + *j.Spec.Parallelism
			}

			//Compute number of VSIs to be provisioned and job parallelism for each VSI
			parallelism, numInstances, err := platform.ComputeParallelismAndInstanceCount(vpcService, profile, workerCount)
			if err != nil {
				return fmt.Errorf("failed to compute number of instances and job parallelism: %v", err)
			}
			for _, j := range c.Jobs {
				*j.Spec.Parallelism = int32(parallelism)
			}

			appYamlString, err := ir.MarshalComponentArray(c)
			if err != nil {
				return fmt.Errorf("failed to marshall yaml: %v", err)
			}

			f, err := os.Create("app.yaml")
			if err != nil {
				return err
			}

			defer f.Close()
			_, err = f.WriteString(appYamlString)
			if err != nil {
				return err
			}

			cmdStr := "env DOCKER_HOST=unix:///var/run/docker.sock docker exec sky sky " + skycmd + " -c " + name + " --workdir . --cloud ibm --num-nodes " + strconv.Itoa(numInstances) +
				" --zone " + zone + " --image-id " + imageID + " --instance-type " + profile + " --env SKYPILOT_DEBUG=1" +
				" \"kubectl apply -f app.yaml\""
			fmt.Println(strconv.Itoa(i) + ":" + cmdStr)
			cmd := exec.Command("/bin/bash", "-c", cmdStr)
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			if err := cmd.Run(); err != nil {
				return fmt.Errorf("internal Error running SkyPilot cmd: %v", err)
			}
		}
		return nil
	}

	t1e := time.Now()

	fmt.Printf("Setup done %s\n", util.RelTime(t1s, t1e))
	fmt.Printf("  - SkyPilot launch %s\n", util.RelTime(t1s, t1e))
	return nil

}

func (backend Backend) SetAction(aopts compilation.Options, ir llir.LLIR, runname string, action Action) error {
	if action == Stop || action == Down {
		if err := stopOrDownSkyCluster(runname, action == Down); err != nil {
			return err
		}
	} else if action == Launch {
		zone := aopts.Zone //command line zone value
		if zone == "" {    //random zone value using config
			randomZone, err := platform.GetRandomizedZone(backend.config, backend.vpcService) //Todo: spread among random zones with a subnet in each zone
			if err != nil {
				return err
			}
			zone = randomZone
		}
		if err := launchSkyCluster(backend.vpcService, runname, ir, zone, aopts.Profile, aopts.ImageID); err != nil {
			return err
		}
	}
	return nil
}
