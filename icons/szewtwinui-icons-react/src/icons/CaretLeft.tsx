import React, { type SVGProps } from 'react';

const SvgCaretLeft = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M12.5 1.2v13.3a.634.634 0 01-1 .5L3.7 8.4a.668.668 0 010-1L11.5.8c.3-.4 1-.1 1 .4z" />
</svg>
);

export default SvgCaretLeft;
export { SvgCaretLeft };
