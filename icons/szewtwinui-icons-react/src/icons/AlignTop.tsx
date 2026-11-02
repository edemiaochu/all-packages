import React, { type SVGProps } from 'react';

const SvgAlignTop = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M0 1h16v1H0zm3 2h4v11H3zm6 0h4v7H9z" fillRule="evenodd" />
</svg>
);

export default SvgAlignTop;
export { SvgAlignTop };
