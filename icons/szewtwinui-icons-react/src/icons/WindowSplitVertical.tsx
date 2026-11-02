import React, { type SVGProps } from 'react';

const SvgWindowSplitVertical = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M0 0v16h16V0zm12 1h1v1h-1zM1 4h6v11H1zm14 11H8V4h7zM14 2V1h1v1z" />
</svg>
);

export default SvgWindowSplitVertical;
export { SvgWindowSplitVertical };
