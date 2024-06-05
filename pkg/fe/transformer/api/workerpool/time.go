package workerpool

import "strconv"

// parse 6s/6m/6d/6w into units of seconds
func parseHumanTime(delayString string) (int, error) {
	if delayString == "" {
		return 0, nil
	}

	seconds_per_unit := map[byte]int{'s': 1, 'm': 60, 'h': 3600, 'd': 86400, 'w': 604800}
	unit, hasUnit := seconds_per_unit[delayString[len(delayString)-1]]
	quantity := delayString

	if !hasUnit {
		// then we were given just a number, which we will interpret as
		// seconds
		unit = 1
	} else {
		quantity = delayString[:len(delayString)-1]
	}

	val, err := strconv.Atoi(quantity)
	if err != nil {
		return 0, err
	}

	return val * unit, nil
}
