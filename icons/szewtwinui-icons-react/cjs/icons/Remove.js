"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgRemove = void 0;
const react_1 = __importDefault(require("react"));
const SvgRemove = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14.7 2.7l-1.4-1.4L8 6.6 2.7 1.3 1.3 2.7 6.6 8l-5.3 5.3 1.4 1.4L8 9.4l5.3 5.3 1.4-1.4L9.4 8z" })));
exports.SvgRemove = SvgRemove;
exports.default = SvgRemove;
