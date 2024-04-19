package widgets

import (
	"context"

	"github.com/mum4k/termdash/widgets/text"
)

func NewRolledText(ctx context.Context) *text.Text {
	textWidget, err := text.New(text.RollContent(), text.WrapAtWords())
	if err != nil {
		panic(err)
	}

	textToWrite := "Hello world"
	if err := textWidget.Write(textToWrite); err != nil {
		panic(err)
	}

	return textWidget
}
