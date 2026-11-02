import React, { type SVGProps } from 'react';

const SvgSmartphone = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11 0H4a.945.945 0 00-1 1v14a.945.945 0 001 1h7a.945.945 0 001-1V1a.945.945 0 00-1-1zM6 1h3v1H6zm1.5 14a.5.5 0 11.5-.5.472.472 0 01-.5.5zm3.5-2H4V3h7z" />
</svg>
);

export default SvgSmartphone;
export { SvgSmartphone };
