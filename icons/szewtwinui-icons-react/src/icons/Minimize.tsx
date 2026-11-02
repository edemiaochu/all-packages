import React, { type SVGProps } from 'react';

const SvgMinimize = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M2 7h12v2H2z" />
</svg>
);

export default SvgMinimize;
export { SvgMinimize };
