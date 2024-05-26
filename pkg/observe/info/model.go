package info

import (
	"lunchpail.io/pkg/assembly"
)

type Options struct {
	Namespace string
	Follow    bool
}

type Info struct {
	Name         string
	Namespace    string
	AssemblyDate string
}

func Model(opts Options) (chan Info, error) {
	c := make(chan Info)
	appname := assembly.Name()
	namespace := appname
	if opts.Namespace != "" {
		namespace = opts.Namespace
	}

	var model Info = Info{appname, namespace, assembly.Date()}
	go func() {
		c <- model
	}()

	return c, nil
}
