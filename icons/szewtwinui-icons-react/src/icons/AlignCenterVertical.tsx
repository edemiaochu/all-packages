import React, { type SVGProps } from 'react';

const SvgAlignCenterVertical = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path fillRule="evenodd" d="M16 7h-3V4H9v3H7V2H3v5H0v1h3v5h4V8h2v3h4V8h3V7z" />
</svg>
);

export default SvgAlignCenterVertical;
export { SvgAlignCenterVertical };
