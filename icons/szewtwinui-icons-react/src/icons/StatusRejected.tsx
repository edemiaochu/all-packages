import React, { type SVGProps } from 'react';

const SvgStatusRejected = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M13 9.48H3v-3h10v3zM11.314 0H4.686L0 4.686v6.628L4.686 16h6.628L16 11.314V4.686L11.314 0z" />
</svg>
);

export default SvgStatusRejected;
export { SvgStatusRejected };
