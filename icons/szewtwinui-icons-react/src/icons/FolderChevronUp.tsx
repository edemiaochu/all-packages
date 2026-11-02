import React, { type SVGProps } from 'react';

const SvgFolderChevronUp = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M14 4H7V3a1.075 1.075 0 00-1-1H2a1.075 1.075 0 00-1 1v10a1.075 1.075 0 001 1h12a1.075 1.075 0 001-1V5a1.075 1.075 0 00-1-1zm-1.8 8L8 7.8 3.8 12l-.9-.9L8 6l5.1 5.1z" />
</svg>
);

export default SvgFolderChevronUp;
export { SvgFolderChevronUp };
