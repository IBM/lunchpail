package dashboard

import (
	"context"
	"fmt"

	"github.com/mum4k/termdash"
	"github.com/mum4k/termdash/container"
	"github.com/mum4k/termdash/keyboard"
	"github.com/mum4k/termdash/terminal/tcell"
	"github.com/mum4k/termdash/terminal/terminalapi"

	containers "lunchpail.io/pkg/dashboard/infrastructure"
)

func Run() error {
	// Create new termdash terminal
	terminal, err := tcell.New()
	if err != nil {
		return fmt.Errorf("failed to initialize tcell terminal: %w", err)
	}
	defer terminal.Close()

	// Construct dashboard elements
	if err := runDashboard(terminal, termdash.Run); err != nil {
		panic(fmt.Errorf("failed to initialize and run dashboard: %w", err))
	}
	return nil
}

type RunFunction func(ctx context.Context, t terminalapi.Terminal, c *container.Container, opts ...termdash.Option) error

func runDashboard(terminal terminalapi.Terminal, runner RunFunction) error {
	// Creating new context
	ctx, cancel := context.WithCancel(context.Background())

	// Creating new termdash container
	container := containers.NewContainer(terminal, ctx)

	// Creating function to quit out of the dashboard terminal
	quitter := func(k *terminalapi.Keyboard) {
		if k.Key == 'q' || k.Key == 'Q' || k.Key == keyboard.KeyCtrlC {
			cancel()
		}
	}

	// Run the dashboard
	return runner(ctx, terminal, container, termdash.KeyboardSubscriber(quitter))
}
