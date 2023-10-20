import { Link } from "react-router-dom"
import { Fragment, PureComponent, ReactNode } from "react"

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

import navigateToHome from "../navigate/home"
import { navigateToWorkerPools } from "../navigate/home"

import type { LocationProps } from "../router/withLocation"

import { name, description, homepage, version } from "../../../../package.json"
import SmallLabel from "../components/SmallLabel"
import ControlPlaneStatus from "../components/ControlPlaneStatus/Summary"

import icon from "../images/icon.png"
import BarsIcon from "@patternfly/react-icons/dist/esm/icons/bars-icon"

export interface BaseState {}

export default abstract class Base<
  Props extends LocationProps = LocationProps,
  State extends BaseState = BaseState,
> extends PureComponent<Props, State> {
  protected headerToggle(): ReactNode {
    return (
      <MastheadToggle>
        <PageToggleButton variant="plain" aria-label="Global navigation" id="vertical-nav-toggle">
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
    )
  }

  /** Redirect back to the main page */
  protected readonly returnHome = () => navigateToHome(this.props)

  /** Redirect back to the WorkerPools section */
  protected readonly returnToWorkerPools = () => navigateToWorkerPools(this.props)

  protected pageTitle() {
    return (
      <span>
        <span className="codeflare--secondary-text">{description}</span>
      </span>
    )
  }

  private header() {
    return (
      <Masthead display={this.inline}>
        {this.headerToggle()}
        <MastheadMain>
          <MastheadBrand>
            <Link to={homepage} target="_blank">
              <Flex>
                <Brand src={icon} alt={name} heights={{ default: "2.5em" }} />
              </Flex>
            </Link>
          </MastheadBrand>
        </MastheadMain>
        <MastheadContent>{this.headerToolbar()}</MastheadContent>
      </Masthead>
    )
  }

  protected headerToolbar() {
    return (
      <Toolbar>
        <ToolbarContent>
          {this.headerToolbarLeftGroup()}
          {this.headerToolbarRightGroup()}
        </ToolbarContent>
      </Toolbar>
    )
  }

  protected headerToolbarLeftGroup() {
    return this.pageTitle()
  }

  protected headerToolbarRightGroup() {
    return (
      <ToolbarGroup align={this.alignRight} spacer={this.spacerMd}>
        {this.headerToolbarRightItems()}
      </ToolbarGroup>
    )
  }

  protected headerToolbarRightItems() {
    return [this.controlPlaneStatusToolbarItem()]
  }

  protected controlPlaneStatusToolbarItem() {
    return (
      <ToolbarItem key="control-plane-status">
        <TextContent>
          <Text component="small">
            <ControlPlaneStatus />
          </Text>
        </TextContent>
      </ToolbarItem>
    )
  }

  protected sidebar(): ReactNode {
    return <Fragment />
  }

  /** The content of the page */
  protected abstract body(): ReactNode

  /** Content to be displayed in the left-hand part of the footer */
  protected footerLeft(): void | ReactNode {}

  /** Content to be displayed in the right-hand part of the footer */
  protected footerRight(): void | ReactNode {}

  private footer(): ReactNode {
    const left = this.footerLeft()
    const right = this.footerRight()
    return (
      <Toolbar>
        <ToolbarContent>
          <ToolbarGroup align={this.alignLeft}>
            <ToolbarItem>
              <SmallLabel>v{version}</SmallLabel>
            </ToolbarItem>
            {left || <Fragment />}
          </ToolbarGroup>

          <ToolbarGroup align={this.alignRight}>
            {right || <Fragment />}

            <ToolbarItem align={this.alignRight}>
              <Settings.Consumer>
                {(settings) => (
                  <Switch
                    hasCheckIcon
                    label="Demo Mode"
                    isChecked={settings?.demoMode[0]}
                    onChange={settings?.demoMode[2]}
                  />
                )}
              </Settings.Consumer>
            </ToolbarItem>
            <ToolbarItem align={this.alignRight}>
              <Settings.Consumer>
                {(settings) => (
                  <Switch
                    hasCheckIcon
                    label="Dark Mode"
                    isChecked={settings?.darkMode[0]}
                    onChange={settings?.darkMode[2]}
                  />
                )}
              </Settings.Consumer>
            </ToolbarItem>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>
    )
  }

  /** Filter chips UI, will be displayed above the page body */
  protected chips(): void | ReactNode {}

  /** Modal overlay UI */
  protected modal(): ReactNode {
    return <Fragment />
  }

  protected readonly inline = { default: "inline" as const }
  protected readonly alignLeft = { default: "alignLeft" as const }
  protected readonly alignRight = { default: "alignRight" as const }
  protected readonly noPadding = { default: "noPadding" as const }
  protected readonly stickyTop = { default: "top" as const }
  protected readonly stickyBottom = { default: "bottom" as const }
  protected readonly transparent = { backgroundColor: "transparent" as const }
  protected readonly spacerMd = { default: "spacerNone" as const, md: "spacerMd" as const }

  /** Title content to place in the PageSection title stripe above the main body content */
  protected abstract title(): string

  /** Subtitle content to place in the PageSection title stripe above the main body content */
  protected abstract subtitle(): ReactNode

  public render() {
    const chips = this.chips()

    return (
      <Page
        header={this.header()}
        sidebar={this.sidebar()}
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
            <Text component="h1">{this.title()}</Text>
            <Text component="p">{this.subtitle()}</Text>
          </TextContent>
        </PageSection>

        <PageSection padding={this.noPadding} isFilled={false}>
          <Divider />
        </PageSection>
        <PageSection padding={this.noPadding} hasOverflowScroll isFilled aria-label="codeflare-dashboard-body">
          {this.body()}
        </PageSection>
        <PageSection isFilled={false} stickyOnBreakpoint={this.stickyBottom} padding={this.noPadding}>
          {this.footer()}
        </PageSection>

        {this.modal()}
      </Page>
    )
  }
}
