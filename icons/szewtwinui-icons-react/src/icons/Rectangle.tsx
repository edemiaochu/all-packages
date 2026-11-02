import React, { type SVGProps } from 'react';

const SvgRectangle = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M13.5 11.5h-11v-7h11zM15 3H1v10h14V3z" />
</svg>
);

export default SvgRectangle;
export { SvgRectangle };
