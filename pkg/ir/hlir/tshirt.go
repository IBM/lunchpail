package hlir

type TShirtSize string

const (
	XxsSize  TShirtSize = "xxs"
	XsSize              = "xs"
	SmSize              = "sm"
	MdSize              = "md"
	LgSize              = "lg"
	XlSize              = "xl"
	XxlSize             = "xxl"
	AutoSize            = "auto"
)

func ordinal(size TShirtSize) uint {
	switch size {
	case AutoSize:
		return 0
	case XxsSize:
		return 1
	case XsSize:
		return 2
	case SmSize:
		return 3
	case MdSize:
		return 4
	case LgSize:
		return 5
	case XlSize:
		return 6
	case XxlSize:
		return 7
	}

	return 0
}

func MaxTShirtSize(s1, s2 TShirtSize) TShirtSize {
	if ordinal(s1) > ordinal(s2) {
		return s1
	}
	return s2
}
