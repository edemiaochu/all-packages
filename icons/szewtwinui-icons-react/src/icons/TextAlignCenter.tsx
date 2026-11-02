import React, { type SVGProps } from 'react';

const SvgTextAlignCenter = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M2 14h12v1H2zm-2-3h16v1H0zm2-3h12v1H2zM0 5h16v1H0zm2-3h12v1H2z" />
</svg>
);

export default SvgTextAlignCenter;
export { SvgTextAlignCenter };
