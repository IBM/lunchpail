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
    origSetValue(fieldId, value)
    if (formState) {
      // remember user setting
      const form = tryParse(formState[0] || "{}")
      if (!form[kind]) {
        form[kind] = {}
      }
      form[kind][fieldId] = value
      formState[1](JSON.stringify(form))
    }

    if (onChange) {
      onChange(fieldId, value, ctrl.values, setValue)
    }
  }

  return Object.assign({}, ctrl, { setValue })
}
