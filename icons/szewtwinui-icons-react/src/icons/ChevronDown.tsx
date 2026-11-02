import React, { type SVGProps } from 'react';

const SvgChevronDown = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M16 4.7l-1.4-1.4L8 9.9 1.4 3.3 0 4.7l8 8z" />
</svg>
);

export default SvgChevronDown;
export { SvgChevronDown };
