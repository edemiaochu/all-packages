import React, { type SVGProps } from 'react';

const SvgTable = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M12.5 11h1a.5.5 0 010 1h-1a.5.5 0 010-1zm0-2h1a.5.5 0 010 1h-1a.5.5 0 010-1zm0-2h1a.5.5 0 010 1h-1a.5.5 0 010-1zm-5 4h1a.5.5 0 010 1h-1a.5.5 0 010-1zm0-2h1a.5.5 0 010 1h-1a.5.5 0 010-1zm0-2h1a.5.5 0 010 1h-1a.5.5 0 010-1zm-5 4h1a.5.5 0 010 1h-1a.5.5 0 010-1zm0-2h1a.5.5 0 010 1h-1a.5.5 0 010-1zm0-2h1a.5.5 0 010 1h-1a.5.5 0 010-1zM15 2H1a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V3a1 1 0 00-1-1zm-5 1v2H6V3zM1 3h4v2H1zm0 10V6h4v7zm5 0V6h4v7zm9 0h-4V6h4zm0-8h-4V3h4z" />
</svg>
);

export default SvgTable;
export { SvgTable };
