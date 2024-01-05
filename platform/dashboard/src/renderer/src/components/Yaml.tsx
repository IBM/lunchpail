import Code, { type Props as CodeProps } from "./Code"

export type Props = Omit<CodeProps, "language"> & Partial<Pick<CodeProps, "language">>

export default function Yaml(props: Props) {
  return (
    <Code {...props} language={props.language ?? "yaml"}>
      {props.children}
    </Code>
  )
}
