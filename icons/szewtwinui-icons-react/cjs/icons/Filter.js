"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFilter = void 0;
const react_1 = __importDefault(require("react"));
const SvgFilter = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M0 0v2l6 5v9l4-3V7l6-5V0z" })));
exports.SvgFilter = SvgFilter;
exports.default = SvgFilter;
