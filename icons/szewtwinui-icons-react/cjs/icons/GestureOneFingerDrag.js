"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgGestureOneFingerDrag = void 0;
const react_1 = __importDefault(require("react"));
const SvgGestureOneFingerDrag = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7.018 7H1V1h8v2.002L9.016 3a1.973 1.973 0 01.984.27V0H0v8h7.018z", opacity: "0.55" }),
    react_1.default.createElement("path", { d: "M16 10.16a1.05 1.05 0 00-1.084-1.016 1.027 1.027 0 00-.907.491v-.034a1.063 1.063 0 00-1.084-1.032 1.051 1.051 0 00-.907.474v-.017a1.063 1.063 0 00-1.084-1.032 1.05 1.05 0 00-.906.474l-.013.018V5a.999.999 0 10-1.997 0v6.281a.12.12 0 01-.128-.035l-1.068-1a1.084 1.084 0 00-1.343-.115.998.998 0 00-.447.689.952.952 0 00.24.787l2.635 3.032A3.942 3.942 0 0010.921 16h1.635a3.472 3.472 0 002.428-.967A3.175 3.175 0 0016 12.72z" })));
exports.SvgGestureOneFingerDrag = SvgGestureOneFingerDrag;
exports.default = SvgGestureOneFingerDrag;
