import React, { type SVGProps } from 'react';

const SvgArrowDown = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M13 11l-5 5-5-5h3V0h4v11" />
</svg>
);

export default SvgArrowDown;
export { SvgArrowDown };
