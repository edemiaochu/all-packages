import React, { type SVGProps } from 'react';

const SvgRoad = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M13 0h1v15h-1M3 0v15h9V0zm5 14H7v-3h1zm0-5H7V6h1zm0-5H7V1h1zM1 0h1v15H1" />
</svg>
);

export default SvgRoad;
export { SvgRoad };
