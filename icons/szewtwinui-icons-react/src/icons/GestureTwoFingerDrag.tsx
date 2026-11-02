import React, { type SVGProps } from 'react';

const SvgGestureTwoFingerDrag = (props: SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 16 16" width="1rem" height="1rem" fill="var(--iui-color-icon-muted, currentColor)" {...props}>
  <path d="M6.008 7H1V1h10v.5h.007a1.974 1.974 0 01.993.275V0H0v8h6.008z" opacity="0.55" />
  <path d="M10.008 3.5a.999.999 0 111.997 0v4.986l.013-.019a1.05 1.05 0 01.907-.473 1.063 1.063 0 011.084 1.032v.017a1.051 1.051 0 01.907-.474A1.063 1.063 0 0116 9.601v.034l-.01 3.086a3.172 3.172 0 01-1.017 2.312A3.483 3.483 0 0112.54 16H9.91a3.941 3.941 0 01-3.013-1.36l-2.635-3.033a.951.951 0 01-.24-.787.998.998 0 01.447-.689 1.084 1.084 0 011.343.115l1.068 1a.12.12 0 00.127.035V5a.992.992 0 011.983-.073V8.5a.5.5 0 001 0z" />
</svg>
);

export default SvgGestureTwoFingerDrag;
export { SvgGestureTwoFingerDrag };
