"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgMore = void 0;
const react_1 = __importDefault(require("react"));
const SvgMore = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M4 8a2 2 0 11-2-2 2 2 0 012 2zm4-2a2 2 0 102 2 2 2 0 00-2-2zm6 0a2 2 0 102 2 2 2 0 00-2-2z" })));
exports.SvgMore = SvgMore;
exports.default = SvgMore;
