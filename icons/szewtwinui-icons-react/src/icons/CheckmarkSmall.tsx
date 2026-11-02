import React, { type SVGProps } from 'react';

const SvgCheckmarkSmall = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M6 13.4L1.3 8.7l1.4-1.4L6 10.6l7.3-7.3 1.4 1.4z" />
</svg>
);

export default SvgCheckmarkSmall;
export { SvgCheckmarkSmall };
