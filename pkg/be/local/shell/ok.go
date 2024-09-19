package shell

import (
	"fmt"
	"slices"
	"strings"

	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func isCompatibleImage(image string) bool {
	return strings.HasPrefix(image, lunchpail.ImageRegistry+"/"+lunchpail.ImageRepo+"/lunchpail") ||
		strings.Contains(image, "alpine") ||
		strings.Contains(image, "minio/minio") ||
		strings.Contains(image, "python")
}

func IsCompatible(c llir.ShellComponent) error {
	switch {
	case c.Application.Spec.Image != "" && !isCompatibleImage(c.Application.Spec.Image):
		return fmt.Errorf("Unable to target the local backend because a component '%s' needs to run in a container: %s", c.C(), c.Application.Spec.Image)

	case c.Application.Spec.SecurityContext.RunAsUser != 0 ||
		c.Application.Spec.SecurityContext.RunAsGroup != 0 ||
		c.Application.Spec.SecurityContext.FsGroup != 0 ||
		c.Application.Spec.ContainerSecurityContext.RunAsUser != 0 ||
		c.Application.Spec.ContainerSecurityContext.RunAsGroup != 0 ||
		c.Application.Spec.ContainerSecurityContext.SeLinuxOptions.Type != "" ||
		c.Application.Spec.ContainerSecurityContext.SeLinuxOptions.Level != "":
		return fmt.Errorf("Unable to target local backend because a component '%s' needs custom Kubernetes security", c.C())

	case slices.IndexFunc(c.Application.Spec.Datasets, func(d hlir.Dataset) bool {
		return d.MountPath != "" || d.Nfs.Server != "" || d.Pvc.ClaimName != ""
	}) >= 0:
		return fmt.Errorf("Unable to target local backend because a component '%s' to mount data as a filesystem", c.C())
	}

	return nil
}
