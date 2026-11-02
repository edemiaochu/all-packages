import React, { type SVGProps } from 'react';

const SvgSave = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M1 1v12l2 2h12V1zm11 12a1 1 0 01-1 1H5a1 1 0 01-1-1v-3a1 1 0 011-1h6a1 1 0 011 1zm1-5.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-5a.5.5 0 01.5-.5h9a.5.5 0 01.5.5zM6 10a1 1 0 011 1v1a1 1 0 01-2 0v-1a1 1 0 011-1" />
</svg>
);

export default SvgSave;
export { SvgSave };
