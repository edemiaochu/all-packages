"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFontSize = void 0;
const react_1 = __importDefault(require("react"));
const SvgFontSize = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13.4 6h-1.9l-2.3 6.3L6 3H3.5L0 13h2.3l.7-2.3h3.6l.7 2.3h3.3l.5-1.7h2.6l.5 1.7H16zM3.5 9l1.3-4.3L6.1 9zm9-2l.9 3.2h-1.8z" })));
exports.SvgFontSize = SvgFontSize;
exports.default = SvgFontSize;
