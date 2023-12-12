import { type FormContextProps } from "@patternfly/react-core"

/**
 * This is a generic version of FormContextProps that allows the
 * concrete impls to have type safety over their form values.
 */
type Values<Values extends FormContextProps["values"] = FormContextProps["values"]> = {
  setValue: FormContextProps["setValue"]
  values: Values
}

export default Values
