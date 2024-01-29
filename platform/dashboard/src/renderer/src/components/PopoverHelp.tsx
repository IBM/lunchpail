import { Popover } from "@patternfly/react-core"
import { type PropsWithChildren, type ReactNode } from "react"

export type PopoverHelpProps = PropsWithChildren<{ title: string; footer?: ReactNode }>

export default function PopoverHelp(props: PopoverHelpProps) {
  return (
    <Popover headerContent={props.title} bodyContent={props.children} footerContent={props.footer} position="bottom">
      <button className="pf-v5-c-progress-stepper__step-title pf-m-help-text">{props.title}</button>
    </Popover>
  )
}
