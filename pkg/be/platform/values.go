package platform

type Values struct {
	// list of key=value pairs
	Kv []string

	// Do we need a Kubernetes service account?
	NeedsServiceAccount bool
}
