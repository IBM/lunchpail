package ibmcloud

func New(opts NewOptions) (Backend, error) {
	config := loadConfigWithCommandLineOverrides(opts.Options)
	keytype, key, err := loadPublicKey(config, opts.Options)

	vpcService, err := Authenticator(opts.Options.ApiKey, config)
	if err != nil {
		return Backend{}, err
	}

	return Backend{opts.Namespace, config, vpcService, keytype, key}, nil
}
