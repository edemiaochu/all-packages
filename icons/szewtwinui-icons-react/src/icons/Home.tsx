import React, { type SVGProps } from 'react';

const SvgHome = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M2 14.6s0 .4.3.4H7v-4h2v4h4.5c.5 0 .5-.4.5-.4V8.5L8 4 2 8.5zm12-9.3V2h-2v1.8L8 1 0 6.7 1 8l7-5 7 5 1-1.3z" />
</svg>
);

export default SvgHome;
export { SvgHome };
