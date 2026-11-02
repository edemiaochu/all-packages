"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgWindows = void 0;
const react_1 = __importDefault(require("react"));
const SvgWindows = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M0 2.042l6-.824V7H.001M6 8v5.782L.001 12.95V8zm1-6.899L15 0v7H7m8 1v7l-8-1.111V8z" })));
exports.SvgWindows = SvgWindows;
exports.default = SvgWindows;
