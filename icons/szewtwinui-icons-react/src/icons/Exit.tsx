import React, { type SVGProps } from 'react';

const SvgExit = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11 2v4H4v4h7v4l5-6" />
  <path d="M5 14H2V2h3V0H0v16h5z" />
</svg>
);

export default SvgExit;
export { SvgExit };
