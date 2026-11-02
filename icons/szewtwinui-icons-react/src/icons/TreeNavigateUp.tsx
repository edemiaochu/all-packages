import React, { type SVGProps } from 'react';

const SvgTreeNavigateUp = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M0 5l5-5 5 5H7v7h9v4H3V5z" />
</svg>
);

export default SvgTreeNavigateUp;
export { SvgTreeNavigateUp };
