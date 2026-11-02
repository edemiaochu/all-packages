import React, { type SVGProps } from 'react';

const SvgFolderMinimize = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M15 10V4a1 1 0 00-1-1H7V2a1 1 0 00-1-1H2a1 1 0 00-1 1v10a1 1 0 001 1h5v-3z" />
  <path d="M8 13v-2h8v2" />
</svg>
);

export default SvgFolderMinimize;
export { SvgFolderMinimize };
