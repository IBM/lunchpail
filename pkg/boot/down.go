package boot

import (
	"context"
	"fmt"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/fe/linker"
	"lunchpail.io/pkg/observe/runs"
)

type DownOptions struct {
	Namespace string
	Verbose   bool
}

func deleteNamespace(namespace string) error {
	clientset, _, err := kubernetes.Client()
	if err != nil {
		return err
	}

	api := clientset.CoreV1().Namespaces()
	if err := api.Delete(context.Background(), namespace, metav1.DeleteOptions{}); err != nil {
		return err
	}
	fmt.Printf("namespace \"%s\" deleted\n", namespace)
	return nil
}

func Down(runname string, opts DownOptions) error {
	assemblyName := assembly.Name()
	namespace := assemblyName
	if opts.Namespace != "" {
		namespace = opts.Namespace
	}

	if runname == "" {
		singletonRun, err := runs.Singleton(assemblyName, namespace)
		if err != nil {
			return err
		}
		runname = singletonRun.Name
		//              alsoDeleteNamespace = true
	}

	assemblyOptions := assembly.Options{}
	assemblyOptions.Namespace = opts.Namespace

	configureOptions := linker.ConfigureOptions{}
	configureOptions.AssemblyOptions = assemblyOptions
	configureOptions.Verbose = opts.Verbose

	upOptions := UpOptions{}
	upOptions.ConfigureOptions = configureOptions
	upOptions.UseThisRunName = runname

	return upDown(upOptions, kubernetes.DeleteIt)

	//	if alsoDeleteNamespace {
	//		if err := deleteNamespace(namespace); err != nil {
	//			return err
	//		}
	//	}
}
