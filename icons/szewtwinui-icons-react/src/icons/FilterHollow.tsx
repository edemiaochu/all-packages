import React, { type SVGProps } from 'react';

const SvgFilterHollow = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M15 1v.5L9.4 6.2l-.4.3v6L7 14V6.5l-.4-.3L1 1.5V1zm1-1H0v2l6 5v9l4-3V7l6-5z" />
</svg>
);

export default SvgFilterHollow;
export { SvgFilterHollow };
