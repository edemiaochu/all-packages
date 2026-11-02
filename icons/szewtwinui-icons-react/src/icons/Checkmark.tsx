import React, { type SVGProps } from 'react';

const SvgCheckmark = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M6 14L0 8l2-2 4 4 8-8 2 2L6 14z" />
</svg>
);

export default SvgCheckmark;
export { SvgCheckmark };
