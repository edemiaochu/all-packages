import React, { type SVGProps } from 'react';

const SvgPlayBackward = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11 3a1 1 0 011 1v8a1 1 0 01-1.496.868l-7-4a1 1 0 010-1.736l7-4A.999.999 0 0111 3z" />
</svg>
);

export default SvgPlayBackward;
export { SvgPlayBackward };
