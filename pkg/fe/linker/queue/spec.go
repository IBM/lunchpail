package queue

type Spec struct {
	Name      string
	Auto      bool
	Bucket    string
	Endpoint  string
	Port      int
	AccessKey string
	SecretKey string
}

func (spec Spec) UpdateEndpoint(endpoint string) Spec {
	spec.Endpoint = endpoint
	return spec
}
