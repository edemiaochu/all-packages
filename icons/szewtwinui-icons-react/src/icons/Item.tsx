import React, { type SVGProps } from 'react';

const SvgItem = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M0 8l8-8 8 8-8 8z" />
</svg>
);

export default SvgItem;
export { SvgItem };
