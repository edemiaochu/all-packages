"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgWindowPopout = void 0;
const react_1 = __importDefault(require("react"));
const SvgWindowPopout = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 0v5.4l-1.9-2-8.4 8.4-1.5-1.5 8.3-8.4L10.6 0M16 16V7h-1v8H1V1h8V0H0v16z" })));
exports.SvgWindowPopout = SvgWindowPopout;
exports.default = SvgWindowPopout;
