import React, { type SVGProps } from 'react';

const SvgDistributeBottom = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M16 6v1H0V6h5V2h6v4zm-3 3H3v4H0v1h16v-1h-3z" fillRule="evenodd" />
</svg>
);

export default SvgDistributeBottom;
export { SvgDistributeBottom };
