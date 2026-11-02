import React, { type SVGProps } from 'react';

const SvgUndo = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M16 14c0-5.2-4.2-9.3-9-9.4V2L0 7.3l7 5.3V10c4.3 0 6.7 1.8 9 4" />
</svg>
);

export default SvgUndo;
export { SvgUndo };
