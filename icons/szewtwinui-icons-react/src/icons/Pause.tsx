import React, { type SVGProps } from 'react';

const SvgPause = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8 13H5V3h3zm4-10H9v10h3z" />
</svg>
);

export default SvgPause;
export { SvgPause };
