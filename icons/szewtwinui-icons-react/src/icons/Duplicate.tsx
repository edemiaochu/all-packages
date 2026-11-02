import React, { type SVGProps } from 'react';

const SvgDuplicate = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M12 16H0V4h2v10h10z" />
  <path d="M3 1v12h12V1zm10 7h-3v3H8V8H5V6h3V3h2v3h3z" />
</svg>
);

export default SvgDuplicate;
export { SvgDuplicate };
