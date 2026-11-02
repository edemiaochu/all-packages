import React, { type SVGProps } from 'react';

const SvgChevronLeft = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11.3 0l1.4 1.4L6.1 8l6.6 6.6-1.4 1.4-8-8z" />
</svg>
);

export default SvgChevronLeft;
export { SvgChevronLeft };
