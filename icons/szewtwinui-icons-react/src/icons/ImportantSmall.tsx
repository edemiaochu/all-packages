import React, { type SVGProps } from 'react';

const SvgImportantSmall = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M6.25 1h3.5v3.19l-.676 6.408H6.91L6.25 4.19zm.12 10.572h3.268V15H6.37z" />
</svg>
);

export default SvgImportantSmall;
export { SvgImportantSmall };
