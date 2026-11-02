import React, { type SVGProps } from 'react';

const SvgMoreSmall = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M5 7a1 1 0 11-1 1 1 1 0 011-1zm3 0a1 1 0 11-1 1 1 1 0 011-1zm3 0a1 1 0 11-1 1 1 1 0 011-1z" fillRule="evenodd" />
</svg>
);

export default SvgMoreSmall;
export { SvgMoreSmall };
