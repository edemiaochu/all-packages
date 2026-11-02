import React, { type SVGProps } from 'react';

const SvgCloud = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M16 9.9c0 1.7-1.4 3.1-3.1 3.1H3.1C1.4 13 0 11.6 0 9.9c0-1.6 1.1-2.8 2.6-3v-.3c0-1.1.9-1.9 2-1.9.5 0 .9.2 1.3.5.6-1.4 1.4-2.6 3.6-2.6 2.7 0 4 2 4 4.2v.3c1.4.1 2.5 1.2 2.5 2.8" />
</svg>
);

export default SvgCloud;
export { SvgCloud };
