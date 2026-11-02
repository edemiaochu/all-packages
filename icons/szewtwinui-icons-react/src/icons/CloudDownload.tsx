import React, { type SVGProps } from 'react';

const SvgCloudDownload = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M11 10V7a1 1 0 00-1-1H7a1 1 0 00-1 1v3H3.1A3.057 3.057 0 010 7.02a2.872 2.872 0 012.6-2.885v-.289a1.89 1.89 0 012-1.827 2.155 2.155 0 011.3.481A3.53 3.53 0 019.5 0a3.794 3.794 0 014 4.038v.289A2.617 2.617 0 0116 7.019 3.057 3.057 0 0112.9 10zm-2.556 6L12 11h-2V7H7v4H5z" />
</svg>
);

export default SvgCloudDownload;
export { SvgCloudDownload };
