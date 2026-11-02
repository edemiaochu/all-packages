import React, { type SVGProps } from 'react';

const SvgRecord = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M8 3a5 5 0 11-5 5 5 5 0 015-5z" fillRule="evenodd" />
</svg>
);

export default SvgRecord;
export { SvgRecord };
