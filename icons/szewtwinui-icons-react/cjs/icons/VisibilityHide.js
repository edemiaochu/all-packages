"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgVisibilityHide = void 0;
const react_1 = __importDefault(require("react"));
const SvgVisibilityHide = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M1.707 12.879L12.879 1.707l1.414 1.414L3.121 14.293zM2.7 11.2l1.1-1.1a5.063 5.063 0 01-2-2.1A7.483 7.483 0 018 4.5a4.869 4.869 0 011.2.1l1.3-1.3A10.074 10.074 0 008 3a8.841 8.841 0 00-8 5 8.425 8.425 0 002.7 3.2zm10.7-6.4l-1.1 1.1a7.086 7.086 0 012 2.1 7.503 7.503 0 01-6.2 3.5 8.317 8.317 0 01-1.3-.2l-1.3 1.3a8.909 8.909 0 006.4-.5A9.043 9.043 0 0016 8a9.168 9.168 0 00-2.6-3.2z" })));
exports.SvgVisibilityHide = SvgVisibilityHide;
exports.default = SvgVisibilityHide;
