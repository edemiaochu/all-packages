import React, { type SVGProps } from 'react';

const SvgWindowPopout = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M16 0v5.4l-1.9-2-8.4 8.4-1.5-1.5 8.3-8.4L10.6 0M16 16V7h-1v8H1V1h8V0H0v16z" />
</svg>
);

export default SvgWindowPopout;
export { SvgWindowPopout };
