import React, { type SVGProps } from 'react';

const SvgSwap = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M5 15l-3.781-3.5L5 8v2h8v3H5zm6-7l3.781-3.5L11 1v2H3v3h8z" />
</svg>
);

export default SvgSwap;
export { SvgSwap };
