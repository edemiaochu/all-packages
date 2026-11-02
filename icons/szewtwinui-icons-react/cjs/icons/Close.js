"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgClose = void 0;
const react_1 = __importDefault(require("react"));
const SvgClose = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14 0L8 6 2 0 0 2l6 6-6 6 2 2 6-6 6 6 2-2-6-6 6-6" })));
exports.SvgClose = SvgClose;
exports.default = SvgClose;
