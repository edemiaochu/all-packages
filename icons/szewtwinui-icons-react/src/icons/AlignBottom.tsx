import React, { type SVGProps } from 'react';

const SvgAlignBottom = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M0 14h16v-1H0zm3-2h4V1H3zm6 0h4V5H9z" fillRule="evenodd" />
</svg>
);

export default SvgAlignBottom;
export { SvgAlignBottom };
