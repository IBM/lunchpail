package kubernetes

type NewOptions struct {
	Namespace string
}

func New(opts NewOptions) Backend {
	ns := opts.Namespace
	if ns == "" {
		ns = "default"
	}
	return Backend{ns}
}
