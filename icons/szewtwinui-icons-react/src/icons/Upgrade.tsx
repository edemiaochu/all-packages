import React, { type SVGProps } from 'react';

const SvgUpgrade = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M5 14v1h6v-1zm6-4H5v1h6zm-6 3h6v-1H5zm0-4h6V7h3L8 0 2 7h3z" />
</svg>
);

export default SvgUpgrade;
export { SvgUpgrade };
