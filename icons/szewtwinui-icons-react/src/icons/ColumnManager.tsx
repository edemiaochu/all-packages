import React, { type SVGProps } from 'react';

const SvgColumnManager = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M1 0h2v16H1M7 0h2v16H7m6-16h2v16h-2" />
</svg>
);

export default SvgColumnManager;
export { SvgColumnManager };
