import React, { type SVGProps } from 'react';

const SvgAlignRight = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M14 0h-1v16h1zm-2 9H1v4h11zm0-6H5v4h7z" fillRule="evenodd" />
</svg>
);

export default SvgAlignRight;
export { SvgAlignRight };
