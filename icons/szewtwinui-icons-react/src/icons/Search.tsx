import React, { type SVGProps } from 'react';

const SvgSearch = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11 9.7c.7-1 1.1-2.2 1.1-3.5.1-3.5-2.7-6.2-6-6.2C2.7 0 0 2.7 0 6.1s2.7 6.1 6.1 6.1c1.3 0 2.5-.4 3.5-1.1l4.9 4.9 1.4-1.4zm-5 .5c-2.3 0-4.1-1.8-4.1-4.1S3.7 2 6 2s4.1 1.8 4.1 4.1-1.8 4.1-4.1 4.1" />
</svg>
);

export default SvgSearch;
export { SvgSearch };
