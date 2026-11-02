import React, { type SVGProps } from 'react';

const SvgSoundMute = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M10.693 1.727L6.511 4.994H4.464a.949.949 0 00-.964.937v4.128a.949.949 0 00.964.937h2.047l4.199 3.274a1.11 1.11 0 001.79-.87V2.58a1.126 1.126 0 00-1.807-.853z" />
</svg>
);

export default SvgSoundMute;
export { SvgSoundMute };
