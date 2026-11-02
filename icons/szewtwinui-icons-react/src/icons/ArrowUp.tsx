import React, { type SVGProps } from 'react';

const SvgArrowUp = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M13 5L8 0 3 5h3v11h4V5z" />
</svg>
);

export default SvgArrowUp;
export { SvgArrowUp };
