import React, { type SVGProps } from 'react';

const SvgDownload = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M14 7h-4V0H6v7H2l6 5zm0 4v3H2v-3H0v5h16v-5z" />
</svg>
);

export default SvgDownload;
export { SvgDownload };
