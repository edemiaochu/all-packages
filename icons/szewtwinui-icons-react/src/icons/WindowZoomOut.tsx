import React, { type SVGProps } from 'react';

const SvgWindowZoomOut = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M16 0v6l-2.2-2.2-3.3 3.4-1.7-1.7 3.4-3.3L10 0zM7.2 10.5l-3.4 3.3L6 16H0v-6l2.2 2.2 3.3-3.4z" />
</svg>
);

export default SvgWindowZoomOut;
export { SvgWindowZoomOut };
