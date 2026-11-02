import React, { type SVGProps } from 'react';

const SvgTag = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M9 0L0 9l7 7 9-9V0zm3.5 5A1.5 1.5 0 1114 3.5 1.5 1.5 0 0112.5 5z" />
</svg>
);

export default SvgTag;
export { SvgTag };
