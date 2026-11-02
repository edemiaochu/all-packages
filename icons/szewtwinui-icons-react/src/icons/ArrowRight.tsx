import React, { type SVGProps } from 'react';

const SvgArrowRight = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11 3l5 5-5 5v-3H0V6h11z" />
</svg>
);

export default SvgArrowRight;
export { SvgArrowRight };
