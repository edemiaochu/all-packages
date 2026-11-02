import React, { type SVGProps } from 'react';

const SvgScale = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M16 1H4v7H0v7h8v-4h8zM7 14H1V9h3v2h3zm8-4H5V2h10z" />
</svg>
);

export default SvgScale;
export { SvgScale };
