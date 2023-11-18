import type { PropsWithChildren } from "react"
import type { FormGroupProps, FormContextProps } from "@patternfly/react-core"

export type Ctrl = { ctrl: Pick<FormContextProps, "values" | "setValue"> }
export type FormProps = FormGroupProps & { description?: string } & Required<Pick<FormGroupProps, "fieldId">>
export type GroupProps = PropsWithChildren<FormProps>
