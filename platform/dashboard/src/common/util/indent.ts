export default function indent(value: string, level: number) {
  const indentation = Array(level).fill(" ").join("")
  return value
    .split(/\n/)
    .map((line) => `${indentation}${line}`)
    .join("\n")
}
