package status

func max(nums ...int) int {
	max := 0
	for _, n := range nums {
		if n > max {
			max = n
		}
	}
	return max
}
