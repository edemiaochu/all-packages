import React, { type SVGProps } from 'react';

const SvgAlignLeft = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M1 0h1v16H1zm2 9h11v4H3zm0-6h7v4H3z" fillRule="evenodd" />
</svg>
);

export default SvgAlignLeft;
export { SvgAlignLeft };
