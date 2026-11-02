import React, { type SVGProps } from 'react';

const SvgRotateLeft = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8.4.4C5.6.4 3.1 1.9 1.8 4.2L0 2.4v5.2h5.2L3 5.4C4 3.4 6 2 8.4 2c3.3 0 6 2.7 6 6s-2.7 6-6 6c-2.6 0-4.8-1.7-5.7-4H1c.9 3.2 3.8 5.6 7.4 5.6 4.2 0 7.6-3.4 7.6-7.6S12.6.4 8.4.4z" />
</svg>
);

export default SvgRotateLeft;
export { SvgRotateLeft };
