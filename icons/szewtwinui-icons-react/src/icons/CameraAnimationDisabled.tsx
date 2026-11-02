import React, { type SVGProps } from 'react';

const SvgCameraAnimationDisabled = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M0 11.5v-7C0 3.7.7 3 1.5 3h9l.023.002-9.775 9.776C.309 12.509 0 12.029 0 11.5zM5.475 13H10.5c.8 0 1.5-.7 1.5-1.5V11l4 2V3l-1.05.525z" opacity="0.5" />
  <path d="M.47 14.47l14-14 1.06 1.06-14 14z" />
</svg>
);

export default SvgCameraAnimationDisabled;
export { SvgCameraAnimationDisabled };
