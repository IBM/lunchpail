package llir

import "lunchpail.io/pkg/ir/queue"

type Context struct {
	Run   queue.RunContext
	Queue queue.Spec
}

func (ir LLIR) RunName() string {
	return ir.Context.Run.RunName
}

func (ir LLIR) Queue() queue.Spec {
	return ir.Context.Queue
}
