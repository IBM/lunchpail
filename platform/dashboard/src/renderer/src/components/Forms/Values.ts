import { type FormContextProps } from "@patternfly/react-core"

type ValuesWithContext = FormContextProps["values"] & { context?: string }

/**
 * This is a generic version of FormContextProps that allows the
 * concrete impls to have type safety over their form values.
 */
type Values<Values extends ValuesWithContext = ValuesWithContext> = {
  setValue: FormContextProps["setValue"]
  values: Values
}

export default Values
