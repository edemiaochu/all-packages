"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSelectionClear = void 0;
const react_1 = __importDefault(require("react"));
const SvgSelectionClear = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M2 5H1v2h1zm0 3H1v2h1zm7-6H7v1h2zM6 2H4v1h2zM2 3h1V2H1v2h1zm12 7h1V8h-1zm0 2h-1v1h2v-2h-1zm0-5h1V5h-1zm-7 6h2v-1H7zm3 0h2v-1h-2zm-6.85.75l11.1-11.1-1.4-1.4-11.1 11.1z" })));
exports.SvgSelectionClear = SvgSelectionClear;
exports.default = SvgSelectionClear;
