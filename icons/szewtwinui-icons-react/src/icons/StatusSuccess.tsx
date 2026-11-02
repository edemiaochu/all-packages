import React, { type SVGProps } from 'react';

const SvgStatusSuccess = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8 0a8 8 0 108 8 8 8 0 00-8-8zM6.65 12L3 8.59l1.4-1.3 2.36 2.2L11.59 5 13 6.29z" />
</svg>
);

export default SvgStatusSuccess;
export { SvgStatusSuccess };
