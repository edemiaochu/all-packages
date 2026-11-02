"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgImportant = void 0;
const react_1 = __importDefault(require("react"));
const SvgImportant = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M6 0h4v3.645l-.773 7.324H6.754L6 3.645zm.138 12.082h3.734V16H6.138z" })));
exports.SvgImportant = SvgImportant;
exports.default = SvgImportant;
