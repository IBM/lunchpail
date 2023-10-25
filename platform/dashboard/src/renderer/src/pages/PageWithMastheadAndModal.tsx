import { Link } from "react-router-dom"
import { useContext, type ReactNode, type PropsWithChildren } from "react"

import {
  Brand,
  Divider,
  Flex,
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
  TextContent,
  Text,
} from "@patternfly/react-core"

import Settings from "../Settings"

import { name, description, homepage, version } from "../../../../package.json"
import SmallLabel from "../components/SmallLabel"

import icon from "../images/icon.png"
import BarsIcon from "@patternfly/react-icons/dist/esm/icons/bars-icon"

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

function PageTitle() {
  return (
    <span>
      <span className="codeflare--secondary-text">{description}</span>
    </span>
  )
}

function Header() {
  return (
    <Masthead display={inline}>
      <HeaderToggle />
      <MastheadMain>
        <MastheadBrand>
          <Link to={homepage} target="_blank">
            <Flex>
              <Brand src={icon} alt={name} heights={{ default: "2.5em" }} />
            </Flex>
          </Link>
        </MastheadBrand>
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
  return <PageTitle />
}

function HeaderToolbarRightGroup() {
  return (
    <ToolbarGroup align={alignRight} spacer={spacerMd}>
      <HeaderToolbarRightItems />
    </ToolbarGroup>
  )
}

function HeaderToolbarRightItems() {
  return []
}

function Footer(props: Pick<Props, "footerLeft" | "footerRight">): ReactNode {
  const settings = useContext(Settings)
  const left = props.footerLeft
  const right = props.footerRight

  return (
    <Toolbar>
      <ToolbarContent>
        <ToolbarGroup align={alignLeft}>
          <ToolbarItem>
            <SmallLabel>v{version}</SmallLabel>
          </ToolbarItem>
          {left || <></>}
        </ToolbarGroup>

        <ToolbarGroup align={alignRight}>
          {right || <></>}

          <ToolbarItem align={alignRight}>
            <Switch
              ouiaId="demo-mode-switch"
              hasCheckIcon
              label="Demo Mode"
              isChecked={settings?.demoMode[0]}
              onChange={settings?.demoMode[2]}
            />
          </ToolbarItem>
          <ToolbarItem align={alignRight}>
            <Switch
              ouiaId="dark-mode-switch"
              hasCheckIcon
              label="Dark Mode"
              isChecked={settings?.darkMode[0]}
              onChange={settings?.darkMode[2]}
            />
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  )
}

type ModalProps = {
  modal: ReactNode
  title: ReactNode
  subtitle: ReactNode
  sidebar: ReactNode
  footerLeft: ReactNode
  footerRight: ReactNode
}

export type PageWithMastheadAndModalProps = Partial<ModalProps>

type Props = PropsWithChildren<PageWithMastheadAndModalProps>

export default function PageWithMastheadAndModal(props: Props) {
  const chips: ReactNode = undefined

  return (
    <Page
      header={<Header />}
      sidebar={props.sidebar}
      isManagedSidebar
      defaultManagedSidebarIsOpen={true}
      className="codeflare--dashboard"
    >
      {chips ? (
        <>
          <PageSection variant="light">{chips}</PageSection>
        </>
      ) : (
        <></>
      )}
      <PageSection variant="light">
        <TextContent>
          <Text component="h1">{props.title}</Text>
          <Text component="p">{props.subtitle}</Text>
        </TextContent>
      </PageSection>

      <PageSection padding={noPadding} isFilled={false}>
        <Divider />
      </PageSection>
      <PageSection padding={noPadding} hasOverflowScroll isFilled aria-label="codeflare-dashboard-body">
        {props.children}
      </PageSection>
      <PageSection isFilled={false} stickyOnBreakpoint={stickyBottom} padding={noPadding}>
        <Footer {...props} />
      </PageSection>

      {props.modal}
    </Page>
  )
}
