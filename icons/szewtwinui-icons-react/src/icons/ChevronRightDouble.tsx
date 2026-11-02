import React, { type SVGProps } from 'react';

const SvgChevronRightDouble = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M1.4 0L0 1.4 6.6 8 0 14.6 1.4 16l8-8zM8 0L6.6 1.4 13.2 8l-6.6 6.6L8 16l8-8z" />
</svg>
);

export default SvgChevronRightDouble;
export { SvgChevronRightDouble };
