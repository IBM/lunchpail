package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/be/events"
)

func (streamer Streamer) RunEvents(appname, runname string) (chan events.Message, error) {
	return nil, fmt.Errorf("Unsupported operation: StreamRunEvents")
}

func (streamer Streamer) RunComponentUpdates(appname, runname string) (chan events.ComponentUpdate, chan events.Message, error) {
	return nil, nil, fmt.Errorf("Unsupported operation: StreamRunComponentUpdates")
}
