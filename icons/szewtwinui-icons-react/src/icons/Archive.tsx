import React, { type SVGProps } from 'react';

const SvgArchive = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11 7v2H5V7H0v7h16V7zM6 7h4v1H6m5-8v2H5V0H0v6h16V0zM6 0h4v1H6" />
</svg>
);

export default SvgArchive;
export { SvgArchive };
