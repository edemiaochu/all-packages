import React, { type SVGProps } from 'react';

const SvgExport = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M12 12H2V5h2.2l2.5-2H0v11h14V8.4L12 10z" />
  <path d="M4 10c1.7-1.7 3.7-3.1 7-3v2l5-4-5-4v2c-3.5 0-7 3.1-7 7" />
</svg>
);

export default SvgExport;
export { SvgExport };
