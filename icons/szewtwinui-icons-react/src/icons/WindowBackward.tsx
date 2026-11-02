import React, { type SVGProps } from 'react';

const SvgWindowBackward = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M0 0v16h16V0zm12 1h1v1h-1zM1 15V4h14v11zM14 2V1h1v1z" />
  <path d="M7 12L4 9l3-3v2h5v2H7z" />
</svg>
);

export default SvgWindowBackward;
export { SvgWindowBackward };
