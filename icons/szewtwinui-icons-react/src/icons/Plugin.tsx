import React, { type SVGProps } from 'react';

const SvgPlugin = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M5.753 9.169l1.078 1.078L8.09 8.99a.763.763 0 111.079 1.078L7.91 11.326l.72.719-1.799 1.798a2.542 2.542 0 01-3.595 0L1.079 16 0 14.921l2.157-2.157a2.542 2.542 0 010-3.595L3.955 7.37l.72.719L5.932 6.83A.763.763 0 017.01 7.91zm6.831-6.832a2.542 2.542 0 00-3.595 0L7.19 4.135l4.674 4.674 1.798-1.798a2.542 2.542 0 000-3.595L16 1.079 14.921 0z" />
</svg>
);

export default SvgPlugin;
export { SvgPlugin };
