import React, { type SVGProps } from 'react';

const SvgGroupUngroup = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" {...props}>
  <g fillRule="evenodd" fill="var(--iui-color-icon-muted, currentColor)">
    <path d="M12 8a4 4 0 11-4 4 4 4 0 014-4" opacity="0.5" />
    <path d="M4 0L0 8h8" />
  </g>
</svg>
);

export default SvgGroupUngroup;
export { SvgGroupUngroup };
