import React, { type SVGProps } from 'react';

const SvgChevronRight = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M4.7 0L3.3 1.4 9.9 8l-6.6 6.6L4.7 16l8-8z" />
</svg>
);

export default SvgChevronRight;
export { SvgChevronRight };
