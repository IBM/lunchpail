import type { ChildProcess } from "node:child_process"

const clients: Record<string, import("minio").Client> = {}
const portforwards: Record<string, ChildProcess> = {}

/** spawn a port-forward */
async function establishPortForward(
  serviceName: string,
  serviceNamespace: string,
  serviceKind: string,
  servicePort: string,
) {
  const { spawn } = await import("node:child_process")

  return new Promise<{ child: ChildProcess; localEndPoint: string; localPort: number }>((resolve) => {
    const child = spawn(
      "kubectl",
      ["port-forward", `${serviceKind}/${serviceName}`, `:${servicePort}`, "-n", serviceNamespace],
      { stdio: ["inherit", "pipe", "inherit"] },
    )

    let data = ""
    child.stdout.on("data", (chunk) => {
      data += chunk

      const match = data.match(/Forwarding from ([^:]+):(\d+) -> (\d+)/)
      if (match) {
        const [, localEndPoint, localPort] = match
        resolve({ localEndPoint, localPort: parseInt(localPort, 10), child })
      }
    })
  })
}

function getMemoKey(endpoint: string, accessKey: string, secretKey: string) {
  return `${endpoint}.${accessKey}.${secretKey}`
}

export default async function S3Client(endpoint: string, accessKey: string, secretKey: string) {
  const { Client } = await import("minio")

  let endPoint = endpoint.replace(/^https?:\/\//, "")
  let port: undefined | number = undefined
  let useSSL = true

  const memoKey = getMemoKey(endpoint, accessKey, secretKey)
  if (endPoint in clients) {
    console.log("Using memoized S3 client", endPoint)
    return clients[memoKey]
  }

  // e.g. service_name.namespace_name.svc.cluster.local:9000
  const maybeLocalMatch = endPoint.match(/^([^.]+)\.([^.]+)\.([^.]+)\.cluster.local:(\d+)$/)
  if (maybeLocalMatch) {
    const [, serviceName, serviceNamespace, serviceKind, servicePort] = maybeLocalMatch
    const { child, localEndPoint, localPort } = await establishPortForward(
      serviceName,
      serviceNamespace,
      serviceKind,
      servicePort,
    )

    portforwards[endPoint] = child
    endPoint = localEndPoint
    port = localPort
    useSSL = false

    child.on("close", () => {
      delete clients[memoKey]
      delete portforwards[endPoint]
    })
  }

  const client = new Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  })
  clients[memoKey] = client

  return client
}
