"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgArrowLeft = void 0;
const react_1 = __importDefault(require("react"));
const SvgArrowLeft = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M5 3L0 8l5 5v-3h11V6H5V3z" })));
exports.SvgArrowLeft = SvgArrowLeft;
exports.default = SvgArrowLeft;
