import React, { type SVGProps } from 'react';

const SvgDistributeTop = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M16 2v1h-5v4H5V3H0V2h16zM3 9H0v1h3v4h10v-4h3V9H3z" fillRule="evenodd" />
</svg>
);

export default SvgDistributeTop;
export { SvgDistributeTop };
