import React, { type SVGProps } from 'react';

const SvgZoomInCircular = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8 0a8 8 0 108 8 8 8 0 00-8-8m0 14.7A6.7 6.7 0 1114.7 8 6.7 6.7 0 018 14.7zM12 7H9V4H7v3H4v2h3v3h2V9h3z" />
</svg>
);

export default SvgZoomInCircular;
export { SvgZoomInCircular };
