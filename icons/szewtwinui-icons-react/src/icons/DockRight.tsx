import React, { type SVGProps } from 'react';

const SvgDockRight = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M0 2v12h16V2zm11 11H1V3h10z" />
</svg>
);

export default SvgDockRight;
export { SvgDockRight };
