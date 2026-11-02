"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCaretLeftSmall = void 0;
const react_1 = __importDefault(require("react"));
const SvgCaretLeftSmall = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M9.997 4.807v6.4a.28.28 0 01-.443.24L6.1 8.27a.34.34 0 010-.48l3.454-3.224a.269.269 0 01.443.24z" })));
exports.SvgCaretLeftSmall = SvgCaretLeftSmall;
exports.default = SvgCaretLeftSmall;
