package demo

type Options struct {
	N               int
	Namespace       string
	OutputDir       string
	Branch          string
	ImagePullSecret string
	Verbose         bool
	Force           bool
}
