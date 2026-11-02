import React, { type SVGProps } from 'react';

const SvgMoreVerticalCircular = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M14.5 8A6.5 6.5 0 118 1.5 6.5 6.5 0 0114.5 8M16 8a8 8 0 10-8 8 8 8 0 008-8zM9 5a1 1 0 11-1-1 1 1 0 011 1m0 3a1 1 0 11-1-1 1 1 0 011 1m0 3a1 1 0 11-1-1 1 1 0 011 1z" />
</svg>
);

export default SvgMoreVerticalCircular;
export { SvgMoreVerticalCircular };
