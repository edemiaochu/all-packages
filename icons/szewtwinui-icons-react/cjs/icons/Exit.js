"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgExit = void 0;
const react_1 = __importDefault(require("react"));
const SvgExit = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M11 2v4H4v4h7v4l5-6" }),
    react_1.default.createElement("path", { d: "M5 14H2V2h3V0H0v16h5z" })));
exports.SvgExit = SvgExit;
exports.default = SvgExit;
