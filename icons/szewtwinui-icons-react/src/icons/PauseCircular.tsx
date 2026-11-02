import React, { type SVGProps } from 'react';

const SvgPauseCircular = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8 0a8 8 0 108 8 8 8 0 00-8-8M7 11H5V5h2m4 6H9V5h2" />
</svg>
);

export default SvgPauseCircular;
export { SvgPauseCircular };
