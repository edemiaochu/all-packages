import React, { type SVGProps } from 'react';

const SvgCrop = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M2 2V0h2v12h12v2h-2v2h-2v-2H2V4H0V2z" />
  <path d="M14 11V2H5v2h7v7z" />
</svg>
);

export default SvgCrop;
export { SvgCrop };
