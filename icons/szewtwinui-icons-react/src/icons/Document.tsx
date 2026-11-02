import React, { type SVGProps } from 'react';

const SvgDocument = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M10 0H2v16h12V4h-4zm1 0v3h3z" />
</svg>
);

export default SvgDocument;
export { SvgDocument };
