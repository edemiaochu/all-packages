import React, { type SVGProps } from 'react';

const SvgWindowAdd = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M7 12H1V4h11v3h1V0H0v13h7zm4-11h1v1h-1zM9 1h1v1H9z" />
  <path d="M11 8v3H8v2h3v3h2v-3h3v-2h-3V8z" />
</svg>
);

export default SvgWindowAdd;
export { SvgWindowAdd };
