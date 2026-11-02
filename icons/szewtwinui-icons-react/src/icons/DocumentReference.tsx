import React, { type SVGProps } from 'react';

const SvgDocumentReference = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11 0v3h3zm-1 4V0H2v16h12V4zm1.1 10.1H4.9V5.8H9v2.1h2.1zM9.6 7.3V5.8l1.6 1.6H9.6z" />
</svg>
);

export default SvgDocumentReference;
export { SvgDocumentReference };
