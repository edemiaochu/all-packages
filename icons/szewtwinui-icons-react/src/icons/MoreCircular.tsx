import React, { type SVGProps } from 'react';

const SvgMoreCircular = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8 1.5A6.5 6.5 0 111.5 8 6.507 6.507 0 018 1.5M8 0a8 8 0 108 8 8 8 0 00-8-8zM5 7a1 1 0 11-1 1 1 1 0 011-1zm3 0a1 1 0 11-1 1 1 1 0 011-1zm3 0a1 1 0 11-1 1 1 1 0 011-1z" />
</svg>
);

export default SvgMoreCircular;
export { SvgMoreCircular };
