"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgLine = void 0;
const react_1 = __importDefault(require("react"));
const SvgLine = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M1.589 11.374l11.998-7.999.832 1.248-11.998 8z" })));
exports.SvgLine = SvgLine;
exports.default = SvgLine;
