package dashboard

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/mum4k/termdash/widgets/text"
)

// quotations are used as text that is rolled up in a text widget.
var quotations = []string{
	"When some see coincidence, I see consequence. When others see chance, I see cost.",
	"You cannot pass....I am a servant of the Secret Fire, wielder of the flame of Anor. You cannot pass. The dark fire will not avail you, flame of Udûn. Go back to the Shadow! You cannot pass.",
	"I'm going to make him an offer he can't refuse.",
	"May the Force be with you.",
	"The stuff that dreams are made of.",
	"There's no place like home.",
	"Show me the money!",
	"I want to be alone.",
	"I'll be back.",
}

// writeLines writes a line of text to the text widget every delay.
// Exits when the context expires.
func writeLines(ctx context.Context, t *text.Text, delay time.Duration) {
	s := rand.NewSource(time.Now().Unix())
	r := rand.New(s)
	ticker := time.NewTicker(delay)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			i := r.Intn(len(quotations))
			if err := t.Write(fmt.Sprintf("%s\n", quotations[i])); err != nil {
				panic(err)
			}

		case <-ctx.Done():
			return
		}
	}
}

func newRolledText(ctx context.Context) *text.Text {
	rolled, err := text.New(text.RollContent(), text.WrapAtWords())
	if err != nil {
		panic(err)
	}
	if err := rolled.Write("Rolls the content upwards if RollContent() option is provided.\nSupports keyboard and mouse scrolling.\n\n"); err != nil {
		panic(err)
	}
	go writeLines(ctx, rolled, 1*time.Second)
	return rolled
}
