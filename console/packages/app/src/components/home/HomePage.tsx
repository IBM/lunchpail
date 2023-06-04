import React from 'react';
import { CustomHomepageGrid, homePlugin } from '@backstage/plugin-home';
import { Content, Header, Page } from '@backstage/core-components';

export default function homey() {
  return (
    <CustomHomepageGrid>
      <iframe src="https://codeflare.dev" width="100%" height="100%"/>
    </CustomHomepageGrid>
  )
}
