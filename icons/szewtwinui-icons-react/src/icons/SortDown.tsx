import React, { type SVGProps } from 'react';

const SvgSortDown = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M7 0v12.7L3.2 9 2 10.2 8 16l1.2-1.2 4.8-4.6L12.8 9 9 12.7V0z" />
</svg>
);

export default SvgSortDown;
export { SvgSortDown };
