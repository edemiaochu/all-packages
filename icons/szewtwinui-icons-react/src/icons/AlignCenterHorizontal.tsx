import React, { type SVGProps } from 'react';

const SvgAlignCenterHorizontal = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path fillRule="evenodd" d="M13 9H8V7h3V3H8V0H7v3H4v4h3v2H2v4h5v3h1v-3h5V9z" />
</svg>
);

export default SvgAlignCenterHorizontal;
export { SvgAlignCenterHorizontal };
