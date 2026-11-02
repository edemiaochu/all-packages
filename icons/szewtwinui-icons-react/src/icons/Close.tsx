import React, { type SVGProps } from 'react';

const SvgClose = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M14 0L8 6 2 0 0 2l6 6-6 6 2 2 6-6 6 6 2-2-6-6 6-6" />
</svg>
);

export default SvgClose;
export { SvgClose };
