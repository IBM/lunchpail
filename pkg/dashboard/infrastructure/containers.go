package infrastructure

import (
	"context"
	"fmt"

	"github.com/mum4k/termdash/container"
	"github.com/mum4k/termdash/linestyle"
	"github.com/mum4k/termdash/terminal/terminalapi"

	"lunchpail.io/pkg/dashboard/widgets"
)

func NewContainer(t terminalapi.Terminal, ctx context.Context) *container.Container {
	c, err := container.New(
		t,
		container.Border(linestyle.Light),
		container.BorderTitle("PRESS Q OR CTRL+C TO QUIT"),
		container.PlaceWidget(widgets.NewRolledText(ctx)),
	)
	if err != nil {
		panic(fmt.Errorf("failed to generate container: %w", err))
	}
	return c
}
