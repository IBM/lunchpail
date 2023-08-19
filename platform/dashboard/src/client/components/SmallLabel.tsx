import type { PropsWithChildren } from "react"

export default function SmallLabel(props: PropsWithChildren<{ isCentered?: boolean }>) {
  return (
    <div className={"codeflare--text-xs " + (props.isCentered ? "codeflare--text-center" : "")}>{props.children}</div>
  )
}
