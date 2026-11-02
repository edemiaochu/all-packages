import React, { type SVGProps } from 'react';

const SvgAdd = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M7 1v6H1v2h6v6h2V9h6V7H9V1H7z" />
</svg>
);

export default SvgAdd;
export { SvgAdd };
