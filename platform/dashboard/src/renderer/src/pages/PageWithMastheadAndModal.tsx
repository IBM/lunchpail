import { useMemo, type ReactNode, type PropsWithChildren } from "react"

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
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
} from "@patternfly/react-core"

import { description } from "../../../../package.json"

import { inline, noPadding } from "./constants"

import DarkModeToggle from "../components/DarkModeToggle"

import BarsIcon from "@patternfly/react-icons/dist/esm/icons/bars-icon"

import "./PageWithMastheadAndModal.scss"

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

const alignRight = { default: "alignRight" as const }

function HeaderToolbar() {
  return (
    <Toolbar>
      <ToolbarContent>
        <ToolbarGroup>
          <HeaderToolbarLeftGroup />
        </ToolbarGroup>
        <ToolbarGroup align={alignRight}>
          <HeaderToolbarRightGroup />
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  )
}

function HeaderToolbarLeftGroup() {
  return <></>
}

function HeaderToolbarRightGroup() {
  return <DarkModeToggle />
}

export default function PageWithMastheadAndModal(props: Props) {
  const actions = useMemo(() => (!props.actions ? undefined : { actions: props.actions }), [props.actions])

  return (
    <Page
      header={<Header />}
      sidebar={props.sidebar}
      isManagedSidebar
      defaultManagedSidebarIsOpen={true}
      className="codeflare--dashboard"
    >
      <PageSection variant="light">
        <Card isPlain isLarge className="codeflare--dashboard-header" ouiaId={props.title?.toString()}>
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
