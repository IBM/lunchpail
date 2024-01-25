import { parse } from "ini"
import { join } from "node:path"
import { homedir } from "node:os"
import { readFile } from "node:fs/promises"

import type { Profile } from "@jaas/common/api/s3"

type Config = Record<string, { endpoint_url?: string }>
type Credentials = Record<string, { aws_access_key_id: string; aws_secret_access_key: string }>

function zip(config: Config, credentials: Credentials): Profile[] {
  return Object.entries(credentials).map(([profile, values]) => ({
    name: profile,
    endpoint: (config[profile] && config[profile].endpoint_url) || "https://s3.amazonaws.com",
    accessKey: values.aws_access_key_id,
    secretKey: values.aws_secret_access_key,
  }))
}

export default async function listProfiles(): Promise<Profile[]> {
  try {
    const dotAws = join(homedir(), ".aws")
    const [config, credentials] = await Promise.all([
      readFile(join(dotAws, "config"), "utf-8").then((_) => parse(_.toString())),
      readFile(join(dotAws, "credentials"), "utf-8").then((_) => parse(_.toString())),
    ])

    return zip(config, credentials)
  } catch (err) {
    // TODO propagate error to client
    console.error(err)
    return []
  }
}
