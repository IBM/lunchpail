import type { PropsWithChildren } from "react"
import { Badge } from "@patternfly/react-core"

export default function SmallLabel(props: PropsWithChildren<{ count?: number; align?: "left" | "right" | "center" }>) {
  return (
    <span>
      <span
        className={
          "codeflare--text-xs " +
          (props.align === "center" ? "codeflare--text-center" : props.align === "right" ? "codeflare--text-right" : "")
        }
      >
        {props.children}
      </span>{" "}
      {typeof props.count === "number" && props.count > 0 && <Badge isRead>{props.count}</Badge>}
    </span>
  )
}
