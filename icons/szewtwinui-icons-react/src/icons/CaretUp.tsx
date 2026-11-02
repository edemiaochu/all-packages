import React, { type SVGProps } from 'react';

const SvgCaretUp = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M14.7 12.4H1.4a.634.634 0 01-.5-1l6.6-7.8a.668.668 0 011 0l6.6 7.8c.4.3.1 1-.4 1z" />
</svg>
);

export default SvgCaretUp;
export { SvgCaretUp };
