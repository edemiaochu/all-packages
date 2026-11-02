"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSync = void 0;
const react_1 = __importDefault(require("react"));
const SvgSync = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14 8l2-1.5V12a1.044 1.044 0 01-1 1H4v2l-4-3 4-3v2h10zM2 5h10v2l4-3-4-3v2H1a1.044 1.044 0 00-1 1v5.5L2 8z" })));
exports.SvgSync = SvgSync;
exports.default = SvgSync;
