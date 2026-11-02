import React, { type SVGProps } from 'react';

const SvgGroup = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M6 2l-4 8h8zm3.163 4.09A4 4 0 116.141 11h5.477zM12 0v1h3v3h1V0zm4 12h-1v3h-3v1h4zM0 12h1v3h3v1H0zM4 0v1H1v3H0V0z" fillRule="evenodd" />
</svg>
);

export default SvgGroup;
export { SvgGroup };
