"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgReplace = void 0;
const react_1 = __importDefault(require("react"));
const SvgReplace = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M0 0h7v7H0zm16 16H9V9h7zm-6-1h5v-5h-5zM3.152 8.927l-.743-.743L.641 9.952l1.026.035a3.87 3.87 0 001.096 3.5 4 4 0 005.303.354l-.707-.707a3.026 3.026 0 01-4.703-3.076l1.662.035zm10.093-6.932a4 4 0 00-5.268-.318l.707.707a3 3 0 013.854.318 2.86 2.86 0 01.777 2.828h-1.484l1.767 1.768 1.768-1.768h-.99a4.16 4.16 0 00-1.131-3.535" })));
exports.SvgReplace = SvgReplace;
exports.default = SvgReplace;
