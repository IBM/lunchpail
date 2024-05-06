package shrinkwrap

func Up(opts AppOptions) error {
	appname, templatePath, err := stageFromAssembled(StageOptions{"", opts.Verbose})
	if err != nil {
		return err
	}

	namespace := opts.Namespace
	if namespace == "" {
		namespace = appname
	}

	if err := generateCoreYaml(CoreOptions{namespace, opts.ClusterIsOpenShift, opts.HasGpuSupport, opts.DockerHost, opts.OverrideValues, opts.ImagePullSecret, opts.Verbose, opts.DryRun}); err != nil {
		return err
	}

	if err := generateAppYaml(appname, namespace, templatePath, opts); err != nil {
		return err
	}

	return nil
}
