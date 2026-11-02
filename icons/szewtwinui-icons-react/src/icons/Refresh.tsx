import React, { type SVGProps } from 'react';

const SvgRefresh = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M2.1 9H0v5l1.5-1.4A7.741 7.741 0 008 16a7.993 7.993 0 007.9-7h-2A6.016 6.016 0 018 14a5.934 5.934 0 01-5-2.7L5.4 9zM8 0A7.993 7.993 0 00.1 7h2A6.016 6.016 0 018 2a5.72 5.72 0 015.1 2.9L11 7h5V2l-1.4 1.4A8.329 8.329 0 008 0z" />
</svg>
);

export default SvgRefresh;
export { SvgRefresh };
