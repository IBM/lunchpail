package status

func StreamStatus(app, run, namespace string) (chan Status, error) {
	c := make(chan Status)

	podWatcher, eventWatcher, err := startWatching(app, run, namespace)
	if err != nil {
		return c, err
	}

	status := Status{}
	status.AppName = app
	status.RunName = run

	go streamPodUpdates(&status, podWatcher, c)
	go streamEventUpdates(&status, eventWatcher, c)

	return c, nil
}
