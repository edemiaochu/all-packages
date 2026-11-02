import React, { type SVGProps } from 'react';

const SvgMoreVertical = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8 4a2 2 0 112-2 2 2 0 01-2 2zm2 4a2 2 0 10-2 2 2 2 0 002-2zm0 6a2 2 0 10-2 2 2 2 0 002-2z" />
</svg>
);

export default SvgMoreVertical;
export { SvgMoreVertical };
