import React, { type SVGProps } from 'react';

const SvgTextAlignLeft = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M0 14h12v1H0zm0-3h16v1H0zm0-3h12v1H0zm0-3h16v1H0zm0-3h12v1H0z" />
</svg>
);

export default SvgTextAlignLeft;
export { SvgTextAlignLeft };
