import React, { type SVGProps } from 'react';

const SvgUserAdd = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M7 10v3.5H.73a.777.777 0 01-.67-.33.84.84 0 010-.66l1.52-3.36a.645.645 0 01.34-.33l2.36-1.23h.17a3.995 3.995 0 002.3.84 3.876 3.876 0 002.26-.84h.17l.82.42V10zM3.69 3.589C3.69.854 5.042 0 6.732 0s3.042.854 3.042 3.589a3.353 3.353 0 01-3.042 3.588A3.353 3.353 0 013.69 3.59zM13 8v3h3v2h-3v3h-2v-3H8v-2h3V8z" />
</svg>
);

export default SvgUserAdd;
export { SvgUserAdd };
