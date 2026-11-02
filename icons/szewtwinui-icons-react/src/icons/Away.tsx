import React, { type SVGProps } from 'react';

const SvgAway = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M13.445 12.832L7 8.535V1h2v6.465l5.555 3.703z" />
</svg>
);

export default SvgAway;
export { SvgAway };
