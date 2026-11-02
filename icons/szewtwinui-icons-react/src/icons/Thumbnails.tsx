import React, { type SVGProps } from 'react';

const SvgThumbnails = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M9 0h7v7H9zm0 9h7v7H9zM0 9h7v7H0zm0-9h7v7H0z" />
</svg>
);

export default SvgThumbnails;
export { SvgThumbnails };
