import { useContext, useMemo, type ReactNode, type PropsWithChildren } from "react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Divider,
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  MastheadToggle,
  Page,
  PageSection,
  PageToggleButton,
  Switch,
  Toolbar,
  ToolbarGroup,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core"

import Settings from "../Settings"
import { description } from "../../../../package.json"

import BarsIcon from "@patternfly/react-icons/dist/esm/icons/bars-icon"

import "./PageWithMastheadAndModal.scss"

export const inline = { default: "inline" as const }
export const alignLeft = { default: "alignLeft" as const }
export const alignRight = { default: "alignRight" as const }
export const noPadding = { default: "noPadding" as const }
export const stickyTop = { default: "top" as const }
export const stickyBottom = { default: "bottom" as const }
export const transparent = { backgroundColor: "transparent" as const }
export const spacerMd = { default: "spacerNone" as const, md: "spacerMd" as const }

function HeaderToggle() {
  return (
    <MastheadToggle>
      <PageToggleButton variant="plain" aria-label="Global navigation" id="vertical-nav-toggle">
        <BarsIcon />
      </PageToggleButton>
    </MastheadToggle>
  )
}

function Header() {
  return (
    <Masthead display={inline} className="codeflare--masthead">
      <HeaderToggle />
      <MastheadMain>
        <MastheadBrand>{description}</MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <HeaderToolbar />
      </MastheadContent>
    </Masthead>
  )
}

function HeaderToolbar() {
  return (
    <Toolbar>
      <ToolbarContent>
        <HeaderToolbarLeftGroup />
        <HeaderToolbarRightGroup />
      </ToolbarContent>
    </Toolbar>
  )
}

function HeaderToolbarLeftGroup() {
  return <></>
}

function HeaderToolbarRightGroup() {
  const settings = useContext(Settings)

  return (
    <ToolbarGroup align={alignRight} spacer={spacerMd}>
      <ToolbarItem>
        <Switch
          className="codeflare--switch"
          ouiaId="demo-mode-switch"
          label="Demo Mode"
          isChecked={settings?.demoMode[0]}
          onChange={settings?.demoMode[2]}
        />
      </ToolbarItem>
      <ToolbarItem>
        <Switch
          className="codeflare--switch"
          ouiaId="dark-mode-switch"
          label="Dark Mode"
          isChecked={settings?.darkMode[0]}
          onChange={settings?.darkMode[2]}
        />
      </ToolbarItem>
    </ToolbarGroup>
  )
}

export type PageWithMastheadAndModalProps = {
  /** Title to be rendered in the header */
  title: ReactNode

  /** Subtitle to be rendered in the header */
  subtitle: ReactNode

  /** Actions to be rendered in the header */
  actions?: ReactNode

  /** Content to be rendered in a popup modal dialog */
  modal?: ReactNode

  /** Content to be rendered in the hamburger sidebar */
  sidebar: ReactNode
}

/**
 * `props.children` will be rendered as the main body of the page
 */
type Props = PropsWithChildren<PageWithMastheadAndModalProps>

export default function PageWithMastheadAndModal(props: Props) {
  const actions = useMemo(
    () => (!props.actions ? undefined : { hasNoOffset: true, actions: props.actions }),
    [props.actions],
  )

  return (
    <Page
      header={<Header />}
      sidebar={props.sidebar}
      isManagedSidebar
      defaultManagedSidebarIsOpen={true}
      className="codeflare--dashboard"
    >
      <PageSection variant="light">
        <Card isPlain isLarge className="codeflare--dashboard-header">
          <CardHeader actions={actions} className="codeflare--dashboard-header-card-header">
            <CardTitle component="h1">{props.title}</CardTitle>
          </CardHeader>
          <CardBody className="codeflare--dashboard-header-card-body">{props.subtitle}</CardBody>
        </Card>
      </PageSection>

      <PageSection padding={noPadding} isFilled={false}>
        <Divider />
      </PageSection>

      <PageSection padding={noPadding} hasOverflowScroll isFilled aria-label="Dashboard body">
        {props.children}
      </PageSection>

      {props.modal}
    </Page>
  )
}
