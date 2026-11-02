import React, { type SVGProps } from 'react';

const SvgReCenter = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M15.11 7.11h-.98a6.173 6.173 0 00-5.24-5.24V.89a.89.89 0 00-1.78 0v.98a6.173 6.173 0 00-5.24 5.24H.89a.89.89 0 000 1.78h.98a6.173 6.173 0 005.24 5.24v.98a.89.89 0 101.78 0v-.98a6.173 6.173 0 005.24-5.24h.98a.89.89 0 100-1.78zM8 12.52A4.52 4.52 0 1112.52 8 4.515 4.515 0 018 12.52zM8 6a2 2 0 11-2 2 2 2 0 012-2z" />
</svg>
);

export default SvgReCenter;
export { SvgReCenter };
