package main

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"slices"
	"strconv"
	"strings"
	"time"
)

//TODO use librclone/remote rc APIs to use rclone commands instead of exec's below

func main() {
	// this is the handler that will be called for each task
	handler := os.Args[1:]
	jobIndex := os.Getenv("JOB_COMPLETION_INDEX")

	config := "/tmp/rclone.conf"
	remote := "s3:/" + os.Getenv(os.Getenv("TASKQUEUE_VAR")) + "/" + os.Getenv("LUNCHPAIL") +
		"/" + os.Getenv("RUN_NAME") + "/queues/" + os.Getenv("POOL") + ".w" +
		jobIndex + "." + getPodNameSuffix(os.Getenv("POD_NAME"))
	inbox := "inbox"
	processing := "processing"
	outbox := "outbox"
	alive := remote + "/" + inbox + "/.alive"
	local := os.Getenv("WORKQUEUE") + "/" + jobIndex

	// TODO: Check for rclone installation and install, if doesn't exist

	err := createRcloneConfigFile(config, os.Getenv("S3_ENDPOINT_VAR"), os.Getenv("AWS_ACCESS_KEY_ID_VAR"), os.Getenv("AWS_SECRET_ACCESS_KEY_VAR"))
	if err != nil {
		fmt.Println("Internal Error creating rclone config file:", err)
		return
	}

	startupDelayStr := os.Getenv("LUNCHPAIL_STARTUP_DELAY")
	delay, err := time.ParseDuration(startupDelayStr + "s")
	if err != nil {
		fmt.Println("Internal Error parsing startup delay:", err)
		return
	}
	if delay > 0 {
		fmt.Println("Delaying startup by " + startupDelayStr + " seconds")
		time.Sleep(delay)
	}

	err = rcloneTouch(config, alive)
	if err != nil {
		fmt.Println("Internal Error creating alive marker:", err)
		return
	}

	startWatch(handler, config, remote, inbox, processing, outbox, local)
}

func startWatch(handler []string, config, remote, inbox, processing, outbox, local string) {
	for {
		tasks, err := rcloneLsf(config, remote, inbox)
		if err != nil {
			fmt.Println("Internal Error listing tasks:", err)
		}

		for _, task := range tasks {
			if task != "" {
				// TODO: re-check if task still exists in our inbox before starting on it
				in := remote + "/" + inbox + "/" + task
				inprogress := remote + "/" + processing + "/" + task
				out := remote + "/" + outbox + "/" + task

				// capture exit code, stdout and stderr of the handler
				ec := remote + "/" + outbox + "/" + task + ".code"
				succeeded := remote + "/" + outbox + "/" + task + ".succeeded"
				failed := remote + "/" + outbox + "/" + task + ".failed"
				stdout := remote + "/" + outbox + "/" + task + ".stdout"
				stderr := remote + "/" + outbox + "/" + task + ".stderr"

				localinbox := local + "/" + inbox
				localprocessing := local + "/" + processing
				localoutbox := local + "/" + outbox
				localec := localoutbox + "/" + task + ".code"
				localstdout := localoutbox + "/" + task + ".stdout"
				localstderr := localoutbox + "/" + task + ".stderr"

				err := os.MkdirAll(localinbox, os.ModePerm)
				if err != nil {
					fmt.Println("Internal Error creating local inbox:", err)
				}
				err = os.MkdirAll(localprocessing, os.ModePerm)
				if err != nil {
					fmt.Println("Internal Error creating local processing:", err)
				}
				err = os.MkdirAll(localoutbox, os.ModePerm)
				if err != nil {
					fmt.Println("Internal Error creating local outbox:", err)
				}

				err = rcloneCopy(config, in, localprocessing)
				if err != nil {
					fmt.Println("Internal Error copying task to worker processing:", err)
				}

				// fmt.Println("sending file to handler: " + in)
				err = os.Remove(localoutbox + "/" + task)
				if err != nil && !os.IsNotExist(err) {
					fmt.Println("Internal Error removing task from local outbox:", err)
				}

				err = rcloneMoveto(config, in, inprogress)
				if err != nil {
					fmt.Println("Internal Error moving task to global processing:", err)
				}

				// signify that the process is still going... or prematurely terminated
				os.WriteFile(localec, []byte("-1"), os.ModePerm)

				handlercmd := exec.Command(handler[0], slices.Concat(handler[1:], []string{localprocessing + "/" + task, localoutbox + "/" + task})...)

				// open stdout/err files for writing
				stdoutfile, err := os.Create(localstdout)
				if err != nil {
					fmt.Println("Internal Error creating stdout file:", err)
				}
				defer stdoutfile.Close()

				stderrfile, err := os.Create(localstderr)
				if err != nil {
					fmt.Println("Internal Error creating stderr file:", err)
				}
				defer stderrfile.Close()

				multiout := io.MultiWriter(os.Stdout, stdoutfile)
				multierr := io.MultiWriter(os.Stderr, stderrfile)
				handlercmd.Stdout = multiout
				handlercmd.Stderr = multierr
				err = handlercmd.Run()
				if err != nil {
					fmt.Println("Internal Error running the handler:", err)
				}
				EC := handlercmd.ProcessState.ExitCode()

				os.WriteFile(localec, []byte(fmt.Sprintf("%d", EC)), os.ModePerm)

				err = rcloneMoveto(config, localec, ec)
				if err != nil {
					fmt.Println("Internal Error moving exitcode to remote:", err)
				}

				err = rcloneMoveto(config, localstdout, stdout)
				if err != nil {
					fmt.Println("Internal Error moving stdout to remote:", err)
				}

				err = rcloneMoveto(config, localstderr, stderr)
				if err != nil {
					fmt.Println("Internal Error moving stderr to remote:", err)
				}

				if EC == 0 {
					err = rcloneTouch(config, succeeded)
					if err != nil {
						fmt.Println("Internal Error creating succeeded marker:", err)
					}
					// fmt.Println("handler success: " + in)
				} else {
					err = rcloneTouch(config, failed)
					if err != nil {
						fmt.Println("Internal Error creating failed marker:", err)
					}
					fmt.Println("Worker error exit code " + strconv.Itoa(EC) + ": " + in)
				}

				err = rcloneMoveto(config, inprogress, out)
				if err != nil {
					fmt.Println("Internal Error moving task to global outbox:", err)
				}
			}
		}

		time.Sleep(3 * time.Second)
	}
}

func getPodNameSuffix(podName string) string {
	// use pod name suffix hash from batch.v1/Job controller
	parts := strings.Split(podName, "-")
	return parts[len(parts)-1]
}

func createRcloneConfigFile(config, s3Endpoint, accessKeyID, secretAccessKey string) error {
	configFile, err := os.Create(config)
	if err != nil {
		return err
	}
	defer configFile.Close()

	configContent := fmt.Sprintf(`[s3]
type = s3
provider = Other
env_auth = false
endpoint = %s
access_key_id = %s
secret_access_key = %s
acl = public-read
`, os.Getenv(s3Endpoint), os.Getenv(accessKeyID), os.Getenv(secretAccessKey))

	_, err = configFile.WriteString(configContent)
	if err != nil {
		return err
	}

	return nil
}

func rcloneLsf(config, remote, inbox string) ([]string, error) {
	cmd := exec.Command("rclone", "--config", config, "lsf", remote+"/"+inbox, "--files-only", "--exclude", ".alive")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	tasks := strings.Split(string(output), "\n")
	return tasks, nil
}

func rcloneCopy(config, source, destination string) error {
	cmd := exec.Command("rclone", "--config", config, "copy", source, destination)
	err := cmd.Run()
	return err
}

func rcloneMoveto(config, source, destination string) error {
	cmd := exec.Command("rclone", "--config", config, "moveto", source, destination)
	err := cmd.Run()
	return err
}

func rcloneTouch(config, filePath string) error {
	cmd := exec.Command("rclone", "--config", config, "touch", filePath)
	err := cmd.Run()
	return err
}
