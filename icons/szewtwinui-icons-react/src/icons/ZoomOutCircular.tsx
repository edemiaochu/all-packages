import React, { type SVGProps } from 'react';

const SvgZoomOutCircular = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8 0a8 8 0 108 8 8 8 0 00-8-8m0 14.7A6.7 6.7 0 1114.7 8 6.7 6.7 0 018 14.7zM12 9V7H4v2z" />
</svg>
);

export default SvgZoomOutCircular;
export { SvgZoomOutCircular };
