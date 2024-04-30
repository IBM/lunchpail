package widgets

import (
	"context"
	"fmt"

	"github.com/mum4k/termdash/widgets/text"
)

func NewRolledText(ctx context.Context) *text.Text {
	textWidget, err := text.New(text.RollContent(), text.WrapAtWords())
	if err != nil {
		panic(fmt.Errorf("failed to generate a new test widget: %w", err))
	}

	textToWrite := "Hello world"
	if err := textWidget.Write(textToWrite); err != nil {
		panic(fmt.Errorf("failed to write text for the widget to display: %w", err))
	}

	return textWidget
}
