import React, { type SVGProps } from 'react';

const SvgSortUp = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M9 16V3.3L12.8 7 14 5.8 8 0 6.8 1.2 2 5.8 3.2 7 7 3.3V16z" />
</svg>
);

export default SvgSortUp;
export { SvgSortUp };
