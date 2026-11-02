import React, { type SVGProps } from 'react';

const SvgGraphBar = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M1 14V0H0v15h16v-1z" />
  <path d="M12 6h3v7h-3zM7 2h3v11H7zM2 4h3v9H2z" />
</svg>
);

export default SvgGraphBar;
export { SvgGraphBar };
