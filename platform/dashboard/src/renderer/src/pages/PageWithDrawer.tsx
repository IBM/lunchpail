import { type PropsWithChildren } from "react"

import Drawer, { type DrawerProps } from "../components/Drawer"
import PageWithMastheadAndModal, { type PageWithMastheadAndModalProps } from "./PageWithMastheadAndModal"

/**
 * `props.children` is the content to be displayed in the "main",
 * i.e. not in the slide-out Drawer
 */
type Props = PropsWithChildren<PageWithMastheadAndModalProps & DrawerProps>

export default function PageWithDrawer(props: Props) {
  const modalProps = {
    modal: props.modal,
    title: props.title,
    subtitle: props.subtitle,
    sidebar: props.sidebar,
    actions: props.actions,
  }

  return (
    <PageWithMastheadAndModal {...modalProps}>
      <Drawer panelSubtitle={props.panelSubtitle} panelBody={props.panelBody}>
        {props.children}
      </Drawer>
    </PageWithMastheadAndModal>
  )
}
