"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCaretUp = void 0;
const react_1 = __importDefault(require("react"));
const SvgCaretUp = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14.7 12.4H1.4a.634.634 0 01-.5-1l6.6-7.8a.668.668 0 011 0l6.6 7.8c.4.3.1 1-.4 1z" })));
exports.SvgCaretUp = SvgCaretUp;
exports.default = SvgCaretUp;
