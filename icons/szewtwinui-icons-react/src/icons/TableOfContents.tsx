import React, { type SVGProps } from 'react';

const SvgTableOfContents = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M3 5H1V3h2zm12-2H5v2h10zM5 9H3V7h2zm10-2H7v2h8zM5 13H3v-2h2zm10-2H7v2h8z" fillRule="evenodd" />
</svg>
);

export default SvgTableOfContents;
export { SvgTableOfContents };
