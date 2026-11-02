import React, { type SVGProps } from 'react';

const SvgImage = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M10.3 5.9L7.7 9.3 6 7.6 3 11h10z" />
  <circle cx="4.4" cy="5.9" r="1.3" />
</svg>
);

export default SvgImage;
export { SvgImage };
