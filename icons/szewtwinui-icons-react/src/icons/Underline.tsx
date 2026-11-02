import React, { type SVGProps } from 'react';

const SvgUnderline = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M2 0h3v6.7c0 1.1 0 1.8.1 2 .1.5.4.9.9 1.3s1.2.4 2 .4c.9 0 1.5-.2 2-.4.4-.3.7-.6.8-1.1s.2-1.2.2-2.1V0h3v6.4c0 1.5-.1 2.5-.2 3.1s-.5 1.2-.9 1.5c-.4.4-1 .7-1.8 1-.7.3-1.7.4-2.9.4-1.4 0-2.5-.2-3.3-.4-.7-.3-1.3-.6-1.8-1.1-.4-.5-.7-.9-.9-1.4-.1-.6-.2-1.6-.2-3V0m0 14h12v2H2z" />
</svg>
);

export default SvgUnderline;
export { SvgUnderline };
