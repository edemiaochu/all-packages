import React, { type SVGProps } from 'react';

const SvgLine = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M1.589 11.374l11.998-7.999.832 1.248-11.998 8z" />
</svg>
);

export default SvgLine;
export { SvgLine };
