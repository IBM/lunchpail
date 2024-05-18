package cpu

func StreamCpu(run, namespace string, intervalSeconds int) (chan Model, error) {
	c := make(chan Model)
	model := Model{}

	podWatcher, err := startWatching(run, namespace)
	if err != nil {
		return c, err
	}

	// TODO errgroup
	go model.streamPodUpdates(podWatcher, intervalSeconds, c)

	return c, nil
}
