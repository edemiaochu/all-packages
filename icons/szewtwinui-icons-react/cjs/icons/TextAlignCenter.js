"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgTextAlignCenter = void 0;
const react_1 = __importDefault(require("react"));
const SvgTextAlignCenter = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M2 14h12v1H2zm-2-3h16v1H0zm2-3h12v1H2zM0 5h16v1H0zm2-3h12v1H2z" })));
exports.SvgTextAlignCenter = SvgTextAlignCenter;
exports.default = SvgTextAlignCenter;
