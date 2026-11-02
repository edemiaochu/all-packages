import React, { type SVGProps } from 'react';

const SvgDistributeCenterVertical = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M16 4v1h-5v2H5V5H0V4h5V2h6v2zm-3 5H3v2H0v1h3v2h10v-2h3v-1h-3z" fillRule="evenodd" />
</svg>
);

export default SvgDistributeCenterVertical;
export { SvgDistributeCenterVertical };
