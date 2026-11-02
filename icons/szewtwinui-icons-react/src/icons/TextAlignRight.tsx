import React, { type SVGProps } from 'react';

const SvgTextAlignRight = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M4 14h12v1H4zm-4-3h16v1H0zm4-3h12v1H4zM0 5h16v1H0zm4-3h12v1H4z" />
</svg>
);

export default SvgTextAlignRight;
export { SvgTextAlignRight };
