package ibmcloud

import (
	"fmt"

	"lunchpail.io/pkg/be/events"
)

func (backend Backend) StreamRunEvents(appname, runname, namespace string) (chan events.Message, error) {
	return nil, fmt.Errorf("Unsupported operation: StreamRunEvents")
}

func (backend Backend) StreamRunComponentUpdates(appname, runname, namespace string) (chan events.ComponentUpdate, chan events.Message, error) {
	return nil, nil, fmt.Errorf("Unsupported operation: StreamRunComponentUpdates")
}
