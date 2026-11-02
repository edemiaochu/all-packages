import React, { type SVGProps } from 'react';

const SvgScript = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M15.49 1.711A8.274 8.274 0 0116 3.987h-1.352c.231-2.446.842-2.276.842-2.276zm-6.365 10.3A3.101 3.101 0 0010.987 15H1.49C.42 15 0 12.012 0 12.012zm.999-1v1a2.096 2.096 0 001.202 2.047l.68.245a4.233 4.233 0 00.467-1.537c.362-2.568 1.265-9.525 1.265-9.525S13.873 1.047 15.003 1H5.066S3.89 1.047 3.62 2.868c-.158 1.064-.687 5.03-1.099 8.142z" fillRule="evenodd" />
</svg>
);

export default SvgScript;
export { SvgScript };
