"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDocument = void 0;
const react_1 = __importDefault(require("react"));
const SvgDocument = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M10 0H2v16h12V4h-4zm1 0v3h3z" })));
exports.SvgDocument = SvgDocument;
exports.default = SvgDocument;
