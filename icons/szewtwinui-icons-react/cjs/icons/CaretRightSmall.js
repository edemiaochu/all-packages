"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCaretRightSmall = void 0;
const react_1 = __importDefault(require("react"));
const SvgCaretRightSmall = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M6.003 4.807v6.4a.28.28 0 00.443.24L9.9 8.27a.34.34 0 000-.48L6.446 4.566a.269.269 0 00-.443.24z" })));
exports.SvgCaretRightSmall = SvgCaretRightSmall;
exports.default = SvgCaretRightSmall;
