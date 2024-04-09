package dashboard

import (
	"context"

	"github.com/mum4k/termdash/container"
	"github.com/mum4k/termdash/linestyle"
	"github.com/mum4k/termdash/terminal/tcell"
)

func newContainer(t *tcell.Terminal, ctx context.Context) *container.Container {
	c, err := container.New(
		t,
		container.Border(linestyle.Light),
		container.BorderTitle("PRESS Q OR CTRL+C TO QUIT"),
		container.PlaceWidget(newRolledText(ctx)),
	)
	if err != nil {
		panic(err)
	}
	return c
}
