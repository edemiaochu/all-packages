import React, { type SVGProps } from 'react';

const SvgObjectScale = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M15 9l-1.5-2L12 9h1v2a1.001 1.001 0 01-1 1h-1v1h1a2 2 0 002-2V9zM0 0h16v6H0zm1 1h14v4H1zM0 9h1v1H0zm2 0h2v1H2zm3 0h2v1H5zm3 0h1v1H8zm-8 5h1v1H0zm2 0h2v1H2zm3 0h2v1H5zm3 0h1v1H8zm-8-3h1v2H0zm8 0h1v2H8z" fillRule="evenodd" />
</svg>
);

export default SvgObjectScale;
export { SvgObjectScale };
