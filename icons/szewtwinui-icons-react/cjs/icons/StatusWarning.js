"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgStatusWarning = void 0;
const react_1 = __importDefault(require("react"));
const SvgStatusWarning = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15.868 13.267l-6.77-11.62a1.15 1.15 0 00-1.1-.67 1.17 1.17 0 00-1.1.69l-6.77 11.59a1.2 1.2 0 001.1 1.72h13.45a1.19 1.19 0 001.19-1.71zm-6.87-.29h-2v-2h2zm0-3h-2v-5h2z" })));
exports.SvgStatusWarning = SvgStatusWarning;
exports.default = SvgStatusWarning;
