package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/be/events"
)

func (streamer Streamer) RunEvents() (chan events.Message, error) {
	return nil, fmt.Errorf("Unsupported operation: StreamRunEvents")
}

func (streamer Streamer) RunComponentUpdates(cc chan events.ComponentUpdate, cm chan events.Message) error {
	return fmt.Errorf("Unsupported operation: StreamRunComponentUpdates")
}
