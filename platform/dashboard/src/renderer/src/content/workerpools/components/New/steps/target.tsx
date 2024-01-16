import Tiles, { type TileOptions } from "@jay/components/Forms/Tiles"

import KubernetesContexts from "@jay/components/Forms/KubernetesContexts"

import type Target from "../Target"
import type Values from "../Values"

const targetOptions: TileOptions<Target> = [
  {
    title: "Local",
    value: "local",
    description: "Run the workers on your laptop, as Pods in a local Kubernetes cluster that will be managed for you",
  },
  {
    title: "Existing Kubernetes Cluster",
    value: "kubernetes",
    description: "Run the workers as Pods in an existing Kubernetes cluster",
  },
  {
    title: "IBM Cloud VSIs",
    value: "ibmcloudvsi",
    description: "Run the workers on IBM Cloud Virtual Storage Instances",
    isDisabled: true,
  },
]

function targets(ctrl: Values) {
  return (
    <Tiles
      ctrl={ctrl}
      fieldId="target"
      label="Compute Target"
      description="Where do you want the workers to run?"
      options={targetOptions}
    />
  )
}

export default {
  name: "Choose where to run the workers",
  isValid: (ctrl: Values) => {
    if (ctrl.values.target === "kubernetes") {
      return !!ctrl.values.kubecontext
    } else {
      return true
    }
  },
  items: (ctrl: Values) => [
    targets(ctrl),
    ...(ctrl.values.target === "kubernetes"
      ? [<KubernetesContexts<Values> ctrl={ctrl} description="Choose a target Kubernetes cluster for the workers" />]
      : []),
  ],
}
