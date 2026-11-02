"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCaretUpSmall = void 0;
const react_1 = __importDefault(require("react"));
const SvgCaretUpSmall = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M4.807 9.997h6.395a.28.28 0 00.24-.443L8.27 6.097a.34.34 0 00-.48 0h-.001L4.566 9.554a.27.27 0 00.24.443z" })));
exports.SvgCaretUpSmall = SvgCaretUpSmall;
exports.default = SvgCaretUpSmall;
