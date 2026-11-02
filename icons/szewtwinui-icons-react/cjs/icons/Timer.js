"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgTimer = void 0;
const react_1 = __importDefault(require("react"));
const SvgTimer = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13.292 3.8l1.2 1.2 1.5-1.5-3.4-3.5-1.5 1.5 1.2 1.2-.886.886.011.012a7.014 7.014 0 101.021 1.024l.016.016zM7 14.417a5.39 5.39 0 115.39-5.39A5.39 5.39 0 017 14.416zm-.883-4.66a1.268 1.268 0 001.792.007l.008-.008a24.191 24.191 0 001.8-3.6 30.21 30.21 0 00-3.6 1.8A1.268 1.268 0 006.11 9.75z" })));
exports.SvgTimer = SvgTimer;
exports.default = SvgTimer;
