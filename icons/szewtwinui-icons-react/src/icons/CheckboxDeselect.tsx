import React, { type SVGProps } from 'react';

const SvgCheckboxDeselect = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M1.994 0v1h13v13h1L16.006.01 1.994 0zm12 16h-14V2h14zm-13-1h12V3h-12zm10-6h-8V8h8z" />
</svg>
);

export default SvgCheckboxDeselect;
export { SvgCheckboxDeselect };
