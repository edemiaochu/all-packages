import React, { type SVGProps } from 'react';

const SvgStatusRunning = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8 0a8 8 0 108 8 8 8 0 00-8-8M6 11.6V4.4L12 8z" />
</svg>
);

export default SvgStatusRunning;
export { SvgStatusRunning };
