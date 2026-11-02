"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgAdd = void 0;
const react_1 = __importDefault(require("react"));
const SvgAdd = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7 1v6H1v2h6v6h2V9h6V7H9V1H7z" })));
exports.SvgAdd = SvgAdd;
exports.default = SvgAdd;
