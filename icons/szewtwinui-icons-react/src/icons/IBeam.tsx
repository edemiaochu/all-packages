import React, { type SVGProps } from 'react';

const SvgIBeam = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M14 2V0H2v2h1.917A3.083 3.083 0 017 5.083v5.834A3.083 3.083 0 013.917 14H2v2h12v-2h-1.917A3.083 3.083 0 019 10.917V5.083A3.083 3.083 0 0112.083 2z" />
</svg>
);

export default SvgIBeam;
export { SvgIBeam };
