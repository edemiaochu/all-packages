import React, { type SVGProps } from 'react';

const SvgFilter = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M0 0v2l6 5v9l4-3V7l6-5V0z" />
</svg>
);

export default SvgFilter;
export { SvgFilter };
