import { type FormContextProps } from "@patternfly/react-core"

import type { State } from "../../Settings"
import type { DetailableKind } from "../../content"

import tryParse from "./tryParse"

/**
 * Take a FormContextProps controller `ctrl` and intercept `setValue`
 * calls to also record them in our persistent state `formState`.
 */
export default function remember<Values extends Pick<FormContextProps, "setValue" | "values">>(
  kind: DetailableKind,
  ctrl: Values,
  formState: State<string> | undefined,
  onChange?: (
    fieldId: string,
    value: string,
    values: Values["values"],
    setValue: Values["setValue"] | undefined,
  ) => void,
) {
  // origSetValue updates the local copy in the FormContextProvider
  const { setValue: origSetValue } = ctrl

  function setValue(fieldId: string, value: string) {
    // this will update the UI model FormContextProps
    origSetValue(fieldId, value)

    if (formState) {
      // also remember user setting across sessions
      const form = tryParse(formState[0] || "{}")
      if (!form[kind]) {
        form[kind] = {}
      }

      // update the model
      form[kind][fieldId] = value

      if (onChange) {
        // then the view asked to be called back
        onChange(fieldId, value, ctrl.values, (fieldId: string, value: string) => {
          // then that callback also wants to update a value in the
          // form, e.g. to invalidate some related choice
          origSetValue(fieldId, value)
          form[kind][fieldId] = value
        })
      }

      // serialize and persist...
      formState[1](JSON.stringify(form))
    }
  }

  return Object.assign({}, ctrl, { setValue })
}
