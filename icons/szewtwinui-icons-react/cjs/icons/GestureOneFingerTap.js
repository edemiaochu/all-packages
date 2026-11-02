"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgGestureOneFingerTap = void 0;
const react_1 = __importDefault(require("react"));
const SvgGestureOneFingerTap = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14 9.16a1.05 1.05 0 00-1.084-1.016 1.027 1.027 0 00-.907.491v-.034a1.063 1.063 0 00-1.084-1.032 1.051 1.051 0 00-.907.474v-.017a1.063 1.063 0 00-1.084-1.032 1.05 1.05 0 00-.906.474l-.013.018V4a.999.999 0 10-1.997 0v6.281a.12.12 0 01-.128-.035l-1.068-1A1.084 1.084 0 003.48 9.13a.998.998 0 00-.447.689.952.952 0 00.24.787l2.635 3.032A3.942 3.942 0 008.921 15h1.635a3.472 3.472 0 002.428-.967A3.175 3.175 0 0014 11.72z" }),
    react_1.default.createElement("path", { d: "M6.999 1a2.99 2.99 0 00-1.982 5.237V4.183C5.013 4.122 5 4.063 5 4a2.002 2.002 0 012-2h.017a2.002 2.002 0 011.999 2v1.995c.064.003.125.018.188.026A2.99 2.99 0 007 1z", opacity: "0.55" })));
exports.SvgGestureOneFingerTap = SvgGestureOneFingerTap;
exports.default = SvgGestureOneFingerTap;
