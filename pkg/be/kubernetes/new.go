package kubernetes

type NewOptions struct {
	Namespace string
}

func New(opts NewOptions) Backend {
	return Backend{opts.Namespace}
}
