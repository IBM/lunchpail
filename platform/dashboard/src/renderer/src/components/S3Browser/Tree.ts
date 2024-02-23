import type { BucketItem } from "@jaas/common/api/s3"

type InteriorNode = {
  name: string
  children: Tree[]
}

type LeafNode = InteriorNode & Pick<BucketItem, "lastModified">

export type Tree = LeafNode | InteriorNode

export function isLeafNode(item: Tree): item is LeafNode {
  const node = item as InteriorNode
  return typeof node.name === "string" && (!Array.isArray(node.children) || node.children.length === 0)
}

/**
 * Take a list of S3 objects and fold them into a `Tree` model based
 * on the `/` path separators in the `name` field of the `items`.
 */
export function toTree(items: BucketItem[], prefix?: string): Tree[] {
  const slashes = /\//
  const prefixPattern = prefix ? new RegExp("^" + prefix + (prefix.endsWith("/") ? "" : "/")) : undefined

  return items
    .slice(0, 200)
    .map((_) => (!prefixPattern || !_.name ? _.name : _.name.replace(prefixPattern, "")))
    .reduce(
      (r, name) => {
        if (name) {
          name.split(slashes).reduce((q, _, i, a) => {
            const name = a.slice(0, i + 1).join("/")
            let existingChild = (q.children = q.children || []).find((o) => o.name === name)
            if (!existingChild) q.children.push((existingChild = { name, children: [] }))
            return existingChild
          }, r)
        }
        return r
      },
      { children: [] as Tree[] },
    ).children
}
