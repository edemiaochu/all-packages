"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgActivity = void 0;
const react_1 = __importDefault(require("react"));
const SvgActivity = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 32 32", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M31 16H20.7l-2.2 5L14.2.8 9.5 16H1.4c-.6 0-1.1.4-1.3.9-.3 1.2.3 2.1 1.3 2.1h10.1l2.2-7.2 4 18.5L22.5 19h8.1c1 0 1.6-.9 1.3-2.1-.2-.5-.7-.9-1.3-.9" })));
exports.SvgActivity = SvgActivity;
exports.default = SvgActivity;
