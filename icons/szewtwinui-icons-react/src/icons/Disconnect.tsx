import React, { type SVGProps } from 'react';

const SvgDisconnect = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8 0a8 8 0 108 8 8 8 0 00-8-8M1.5 8a6.46 6.46 0 011.41-4L12 13.09A6.49 6.49 0 011.5 8m11.59 4L4 2.91A6.49 6.49 0 0113.09 12" />
</svg>
);

export default SvgDisconnect;
export { SvgDisconnect };
