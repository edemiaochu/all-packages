import React, { type SVGProps } from 'react';

const SvgRedo = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M0 14a9.38 9.38 0 019-9.4V2l7 5.3-7 5.3V10c-4.3 0-6.7 1.8-9 4" />
</svg>
);

export default SvgRedo;
export { SvgRedo };
