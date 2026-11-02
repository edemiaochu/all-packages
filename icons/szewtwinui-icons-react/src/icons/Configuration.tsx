import React, { type SVGProps } from 'react';

const SvgConfiguration = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M14.832 3.586L15.925.701 15.23.004l-2.783 1.095-.497 1.492-5.565 5.573a1.642 1.642 0 00-1.987.298L.522 12.343a1.627 1.627 0 000 2.388l.695.697a1.622 1.622 0 002.385 0l3.876-3.881a1.835 1.835 0 00.298-1.99l5.566-5.573M3.503 7.865l.199-.199A2.915 2.915 0 015.59 6.97a1.26 1.26 0 01.596.1l1.59-1.593A4.079 4.079 0 005.59.303a4.268 4.268 0 00-2.484-.2L5.988 2.99 3.006 5.975.124 3.089a3.987 3.987 0 002.882 4.776h.497m6.957.398L8.87 9.855a2.844 2.844 0 010 1.294l4.472 4.478a1.38 1.38 0 001.888 0l.397-.398a1.385 1.385 0 000-1.89" />
</svg>
);

export default SvgConfiguration;
export { SvgConfiguration };
