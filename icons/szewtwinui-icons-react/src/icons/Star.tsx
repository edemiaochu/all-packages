import React, { type SVGProps } from 'react';

const SvgStar = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M10.7 5L8.6.6a.642.642 0 00-1.2 0L5.3 5l-4.8.7c-.6.1-.6.7-.2 1.1l3.4 3.3-.9 4.8c-.1.7.5.8.9.6L8 13.3l4.3 2.2a.581.581 0 00.9-.6l-.8-4.8 3.5-3.4a.669.669 0 00-.4-1z" />
</svg>
);

export default SvgStar;
export { SvgStar };
