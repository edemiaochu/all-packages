import React, { type SVGProps } from 'react';

const SvgSortMenu = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M4 10V2H2v8H0l3 5 3-5zm4-5h7v2H8zm0 3h6v2H8zm0 3h5v2H8zm0-9h8v2H8z" />
</svg>
);

export default SvgSortMenu;
export { SvgSortMenu };
