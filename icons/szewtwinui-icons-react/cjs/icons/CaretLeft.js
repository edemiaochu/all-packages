"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCaretLeft = void 0;
const react_1 = __importDefault(require("react"));
const SvgCaretLeft = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M12.5 1.2v13.3a.634.634 0 01-1 .5L3.7 8.4a.668.668 0 010-1L11.5.8c.3-.4 1-.1 1 .4z" })));
exports.SvgCaretLeft = SvgCaretLeft;
exports.default = SvgCaretLeft;
