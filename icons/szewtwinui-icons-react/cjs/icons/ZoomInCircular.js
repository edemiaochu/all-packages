"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgZoomInCircular = void 0;
const react_1 = __importDefault(require("react"));
const SvgZoomInCircular = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 0a8 8 0 108 8 8 8 0 00-8-8m0 14.7A6.7 6.7 0 1114.7 8 6.7 6.7 0 018 14.7zM12 7H9V4H7v3H4v2h3v3h2V9h3z" })));
exports.SvgZoomInCircular = SvgZoomInCircular;
exports.default = SvgZoomInCircular;
