import React, { type SVGProps } from 'react';

const SvgWindowZoomIn = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M9 7V1.1l2.1 2.2L14.3 0 16 1.7l-3.3 3.2L14.9 7zm-9 7.4l3.3-3.3L1.1 9H7v5.9l-2.1-2.1-3.2 3.3z" />
</svg>
);

export default SvgWindowZoomIn;
export { SvgWindowZoomIn };
