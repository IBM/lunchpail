import type { TileOptions } from "@jaas/components/Forms/Tiles"

import type { Props } from "./Wizard"

export default interface Context {
  applicationOptions: null | TileOptions
}

function applicationTiles(applications: Props["applications"]): Context["applicationOptions"] {
  if (applications.length === 0) {
    return null
  } else {
    return applications.map((application) => ({
      title: application.metadata.name,
      description: application.spec.description,
    })) as TileOptions
  }
}

export function contextFor({ applications }: Props): Context {
  return {
    applicationOptions: applicationTiles(applications),
  }
}
