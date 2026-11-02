import React, { type SVGProps } from 'react';

const SvgChevronRightSmall = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M5.525 2l-1.05 1.05L9.425 8l-4.95 4.95L5.525 14l6-6-6-6z" />
</svg>
);

export default SvgChevronRightSmall;
export { SvgChevronRightSmall };
