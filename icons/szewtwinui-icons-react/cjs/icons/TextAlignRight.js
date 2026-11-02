"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgTextAlignRight = void 0;
const react_1 = __importDefault(require("react"));
const SvgTextAlignRight = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M4 14h12v1H4zm-4-3h16v1H0zm4-3h12v1H4zM0 5h16v1H0zm4-3h12v1H4z" })));
exports.SvgTextAlignRight = SvgTextAlignRight;
exports.default = SvgTextAlignRight;
