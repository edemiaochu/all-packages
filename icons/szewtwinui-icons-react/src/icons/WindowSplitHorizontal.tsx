import React, { type SVGProps } from 'react';

const SvgWindowSplitHorizontal = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M0 0v16h16V0H0m14 1h1v1h-1V1m-2 0h1v1h-1V1m3 3v5H1V4h14M1 15v-5h14v5H1" />
</svg>
);

export default SvgWindowSplitHorizontal;
export { SvgWindowSplitHorizontal };
