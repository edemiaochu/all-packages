"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPause = void 0;
const react_1 = __importDefault(require("react"));
const SvgPause = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 13H5V3h3zm4-10H9v10h3z" })));
exports.SvgPause = SvgPause;
exports.default = SvgPause;
