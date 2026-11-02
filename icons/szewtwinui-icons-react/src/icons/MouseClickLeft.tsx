import React, { type SVGProps } from 'react';

const SvgMouseClickLeft = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M6 9H4V8h2zm7-3.5v5a5.5 5.5 0 01-11 0v-5a5.5 5.5 0 0111 0zM8 1.05v1.042A1.496 1.496 0 019 3.5V6h3v-.5a4.49 4.49 0 00-4-4.45zM7.5 3a.5.5 0 00-.5.5v3a.5.5 0 001 0v-3a.5.5 0 00-.5-.5zm4.5 7.5V7H8.908a1.492 1.492 0 01-2.816 0H3v3.5a4.5 4.5 0 009 0z" />
</svg>
);

export default SvgMouseClickLeft;
export { SvgMouseClickLeft };
