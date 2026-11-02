import React, { type SVGProps } from 'react';

const SvgPlay = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M5 3a1 1 0 00-1 1v8a1 1 0 001.496.868l7-4a1 1 0 000-1.736l-7-4A.999.999 0 005 3z" />
</svg>
);

export default SvgPlay;
export { SvgPlay };
