import React, { type SVGProps } from 'react';

const SvgMenu = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" {...props}>
  <path d="M0 12h16v2H0v-2zm0-5h16v2H0V7zm0-5h16v2H0V2z" fillRule="evenodd" fill="var(--iui-color-icon-muted, currentColor)" />
</svg>
);

export default SvgMenu;
export { SvgMenu };
