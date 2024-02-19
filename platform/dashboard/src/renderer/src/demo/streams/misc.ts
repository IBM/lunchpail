import lorem from "../util/lorem"

export const apiVersion = "codeflare.dev/v1alpha1" as const
export const apiVersionDatashim = "com.ie.ibm.hpsys/v1alpha1" as const

export const ns = lorem.generateWords(3).replace(/\s/g, "-")
