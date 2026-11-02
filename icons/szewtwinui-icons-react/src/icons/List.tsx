import React, { type SVGProps } from 'react';

const SvgList = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M2 2a.945.945 0 01-1 1 .945.945 0 01-1-1 .945.945 0 011-1 1.002 1.002 0 011 1m0 4a.945.945 0 01-1 1 1.002 1.002 0 01-1-1 .945.945 0 011-1 1.002 1.002 0 011 1m0 4a.945.945 0 01-1 1 1.002 1.002 0 01-1-1 .945.945 0 011-1 1.002 1.002 0 011 1m0 4a.945.945 0 01-1 1 1.002 1.002 0 01-1-1 .945.945 0 011-1 1.075 1.075 0 011 1M4 1h12v2H4zm0 4h12v2H4zm0 4h12v2H4zm0 4h12v2H4z" />
</svg>
);

export default SvgList;
export { SvgList };
