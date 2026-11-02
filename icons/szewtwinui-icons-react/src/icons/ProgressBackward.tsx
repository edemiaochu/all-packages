import React, { type SVGProps } from 'react';

const SvgProgressBackward = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M10.43.5l1.756 1.756L6.442 8l5.744 5.744L10.43 15.5 2.93 8z" />
</svg>
);

export default SvgProgressBackward;
export { SvgProgressBackward };
