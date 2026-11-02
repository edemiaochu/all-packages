import React, { type SVGProps } from 'react';

const SvgZoomIn = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M10.5 0a5.493 5.493 0 00-4.362 8.84L4.48 10.479l-.25-.25a.346.346 0 00-.501 0L.107 13.845a.346.346 0 000 .5l1.549 1.547a.374.374 0 00.524 0l3.6-3.617a.346.346 0 000-.5l-.251-.274 1.636-1.634A5.498 5.498 0 1010.5 0m0 9.5a4 4 0 114-4 4.005 4.005 0 01-4 4" />
  <path d="M13 5h-2V3h-1v2H8v1h2v2h1V6h2z" />
</svg>
);

export default SvgZoomIn;
export { SvgZoomIn };
