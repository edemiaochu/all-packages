"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgArrowUp = void 0;
const react_1 = __importDefault(require("react"));
const SvgArrowUp = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13 5L8 0 3 5h3v11h4V5z" })));
exports.SvgArrowUp = SvgArrowUp;
exports.default = SvgArrowUp;
