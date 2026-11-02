"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgProgressBackward = void 0;
const react_1 = __importDefault(require("react"));
const SvgProgressBackward = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M10.43.5l1.756 1.756L6.442 8l5.744 5.744L10.43 15.5 2.93 8z" })));
exports.SvgProgressBackward = SvgProgressBackward;
exports.default = SvgProgressBackward;
