"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCaretRight = void 0;
const react_1 = __importDefault(require("react"));
const SvgCaretRight = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M3.5 14.6V1.3a.634.634 0 011-.5l7.8 6.6a.668.668 0 010 1L4.5 15c-.3.4-1 .1-1-.4z" })));
exports.SvgCaretRight = SvgCaretRight;
exports.default = SvgCaretRight;
