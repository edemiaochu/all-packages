import React, { type SVGProps } from 'react';

const SvgFolderChevronDown = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M14 4H7V3a1.075 1.075 0 00-1-1H2a1.075 1.075 0 00-1 1v10a1.075 1.075 0 001 1h12a1.075 1.075 0 001-1V5a1.075 1.075 0 00-1-1zm-6 8L3.1 7.1l.9-.8 4 4 4-4 .9.9z" />
</svg>
);

export default SvgFolderChevronDown;
export { SvgFolderChevronDown };
