import React, { type SVGProps } from 'react';

const SvgMore = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M4 8a2 2 0 11-2-2 2 2 0 012 2zm4-2a2 2 0 102 2 2 2 0 00-2-2zm6 0a2 2 0 102 2 2 2 0 00-2-2z" />
</svg>
);

export default SvgMore;
export { SvgMore };
