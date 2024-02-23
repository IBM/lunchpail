import { useCallback, useState, type KeyboardEvent, type MouseEvent } from "react"
import { Badge, Nav, MenuContent, MenuItem, MenuList, DrilldownMenu, Menu } from "@patternfly/react-core"

import type S3Props from "./S3Props"
import type PathPrefix from "./PathPrefix"
import { type Tree, isLeafNode } from "./Tree"

import ShowContent from "./ShowContent"
import { filetypeFromName, hasViewableContent } from "./filetypes"

export type NavBrowserProps = S3Props & { roots: Tree[] } & Partial<PathPrefix>

/**
 * A React component that visualizes the forest given by
 * `props.roots[]` by using a PatternFly `<Nav/>` with its drilldown
 * feature.
 */
export default function NavBrowser(props: NavBrowserProps) {
  const rootMenuId = "s3nav-drilldown-rootMenu"
  const [menuDrilledIn, setMenuDrilledIn] = useState<string[]>([])
  const [drilldownPath, setDrilldownPath] = useState<string[]>([])
  const [menuHeights, setMenuHeights] = useState<Record<string, number>>({})
  const [activeMenu, setActiveMenu] = useState(rootMenuId)

  const onDrillIn = useCallback(
    (_event: KeyboardEvent | MouseEvent, fromItemId: string, toItemId: string, itemId: string) => {
      setMenuDrilledIn((prevMenuDrilledIn) => [...prevMenuDrilledIn, fromItemId])
      setDrilldownPath((prevDrilldownPath) => [...prevDrilldownPath, itemId])
      setActiveMenu(toItemId)
    },
    [],
  )

  const onDrillOut = useCallback((_event: KeyboardEvent | MouseEvent, toItemId: string /*, _itemId: string*/) => {
    setMenuDrilledIn((prevMenuDrilledIn) => prevMenuDrilledIn.slice(0, prevMenuDrilledIn.length - 1))
    setDrilldownPath((prevDrilldownPath) => prevDrilldownPath.slice(0, prevDrilldownPath.length - 1))
    setActiveMenu(toItemId)
  }, [])

  const onGetMenuHeight = useCallback((menuId: string, height: number) => {
    //if ((menuHeights[menuId] !== height && menuId !== rootMenuId) || (!menuHeights[menuId] && menuId === rootMenuId)) {
    setMenuHeights((prevMenuHeights) => {
      if (
        (prevMenuHeights[menuId] !== height && menuId !== rootMenuId) ||
        (!prevMenuHeights[menuId] && menuId === rootMenuId)
      ) {
        if (height !== 1 && prevMenuHeights[menuId] !== height) {
          // without this check, the patternfly component enters an infinite loop of e.g. 145->1, 1->145, ...
          return { ...prevMenuHeights, [menuId]: height }
        }
      }

      return prevMenuHeights
    })
  }, [])

  function toMenuItems(roots: Tree[], depth: number, parent?: Tree, parentMenuId?: string) {
    const baseId = `s3nav-drilldown-${depth}-`

    return [
      ...(!parent
        ? []
        : [
            <MenuItem key="up" itemId={`${baseId}-up`} direction="up">
              {parent.name}
            </MenuItem>,
          ]),
      ...(roots.length === 0 && parent && parentMenuId && hasViewableContent(parent.name) && activeMenu === parentMenuId
        ? [<ShowContent key={parent.name} object={parent.name} {...props} />]
        : []),
      ...roots.map((item, idx) => {
        const drilldownMenuId = baseId + `drilldown-${idx}`

        const childFilter = new RegExp("^" + item.name + "/$")
        const children = item.children.filter((_) => !childFilter.test(_.name))

        return (
          <MenuItem
            key={item.name}
            itemId={baseId + `item-${idx}`}
            direction={!isLeafNode(item) || hasViewableContent(item.name) ? "down" : undefined}
            description={!isLeafNode(item) ? "Folder" : filetypeFromName(item.name)}
            drilldownMenu={
              <DrilldownMenu id={drilldownMenuId}>
                {toMenuItems(children, depth + 1, item, drilldownMenuId)}
              </DrilldownMenu>
            }
          >
            {parent ? item.name.replace(parent.name + "/", "") : item.name}{" "}
            {!isLeafNode(item) && <Badge>{children.length}</Badge>}
          </MenuItem>
        )
      }),
    ]
  }

  return (
    <Nav aria-label="s3 file browser" className="codeflare--s3-browser">
      <Menu
        id={rootMenuId}
        containsDrilldown
        drilldownItemPath={drilldownPath}
        drilledInMenus={menuDrilledIn}
        activeMenu={activeMenu}
        onDrillIn={onDrillIn}
        onDrillOut={onDrillOut}
        onGetMenuHeight={onGetMenuHeight}
      >
        <MenuContent menuHeight={menuHeights[activeMenu] ? `${menuHeights[activeMenu]}px` : undefined}>
          <MenuList>{toMenuItems(props.roots, 0)}</MenuList>
        </MenuContent>
      </Menu>
    </Nav>
  )
}
