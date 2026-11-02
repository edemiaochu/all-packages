"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgScale = void 0;
const react_1 = __importDefault(require("react"));
const SvgScale = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 1H4v7H0v7h8v-4h8zM7 14H1V9h3v2h3zm8-4H5V2h10z" })));
exports.SvgScale = SvgScale;
exports.default = SvgScale;
