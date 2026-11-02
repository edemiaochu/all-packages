import React, { type SVGProps } from 'react';

const SvgBookmark = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M4 1.6v12.8L8 12l4 2.4V1.6z" fillRule="evenodd" />
</svg>
);

export default SvgBookmark;
export { SvgBookmark };
