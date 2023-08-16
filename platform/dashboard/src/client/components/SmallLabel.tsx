export default function SmallLabel(props: { isCentered?: boolean; children: string }) {
  return (
    <div className={"codeflare--text-xs " + (props.isCentered ? "codeflare--text-center" : "")}>{props.children}</div>
  )
}
