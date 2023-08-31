import type { PropsWithChildren } from "react"
import { Badge } from "@patternfly/react-core"

export default function SmallLabel(
  props: PropsWithChildren<{ count?: number | string; align?: "left" | "right" | "center"; size?: "xs" | "xxs" }>,
) {
  return (
    <span>
      <span
        className={
          `codeflare--text-${props.size || "xs"} ` +
          (props.align === "center" ? "codeflare--text-center" : props.align === "right" ? "codeflare--text-right" : "")
        }
      >
        {props.children}
      </span>{" "}
      {typeof props.count !== "undefined" && <Badge isRead>{props.count}</Badge>}
    </span>
  )
}
