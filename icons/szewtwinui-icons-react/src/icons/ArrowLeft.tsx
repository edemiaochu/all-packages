import React, { type SVGProps } from 'react';

const SvgArrowLeft = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M5 3L0 8l5 5v-3h11V6H5V3z" />
</svg>
);

export default SvgArrowLeft;
export { SvgArrowLeft };
