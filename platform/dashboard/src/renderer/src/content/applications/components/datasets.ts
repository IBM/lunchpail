import type Props from "./Props"

function inputs(props: Pick<Props, "application">) {
  return props.application.spec.inputs
    ? props.application.spec.inputs.flatMap((_) => Object.values(_.sizes)).filter(Boolean)
    : []
}

export function datasets(props: Pick<Props, "application" | "datasets">) {
  return inputs(props).filter(
    (datasetName) => !!props.datasets.find((dataset) => datasetName === dataset.metadata.name),
  )
}
