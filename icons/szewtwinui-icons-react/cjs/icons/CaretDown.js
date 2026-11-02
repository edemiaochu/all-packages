"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCaretDown = void 0;
const react_1 = __importDefault(require("react"));
const SvgCaretDown = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M1.4 3.3h13.3a.634.634 0 01.5 1l-6.6 7.8a.668.668 0 01-1 0L.9 4.3a.608.608 0 01.5-1z" })));
exports.SvgCaretDown = SvgCaretDown;
exports.default = SvgCaretDown;
