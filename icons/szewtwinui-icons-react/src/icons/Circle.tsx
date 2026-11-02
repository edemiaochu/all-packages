import React, { type SVGProps } from 'react';

const SvgCircle = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8 2.5A5.5 5.5 0 112.5 8 5.506 5.506 0 018 2.5M8 1a7 7 0 107 7 7 7 0 00-7-7z" />
</svg>
);

export default SvgCircle;
export { SvgCircle };
