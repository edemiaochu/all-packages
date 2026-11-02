"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgArrowDown = void 0;
const react_1 = __importDefault(require("react"));
const SvgArrowDown = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13 11l-5 5-5-5h3V0h4v11" })));
exports.SvgArrowDown = SvgArrowDown;
exports.default = SvgArrowDown;
