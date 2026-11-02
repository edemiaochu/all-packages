"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgTag = void 0;
const react_1 = __importDefault(require("react"));
const SvgTag = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M9 0L0 9l7 7 9-9V0zm3.5 5A1.5 1.5 0 1114 3.5 1.5 1.5 0 0112.5 5z" })));
exports.SvgTag = SvgTag;
exports.default = SvgTag;
