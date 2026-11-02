"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgForms = void 0;
const react_1 = __importDefault(require("react"));
const SvgForms = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M11 3V0l3 3h-3zm-1 1h4v12H2V0h8v4zM3.5 14.5h5v-2h-5v2zm6.5-2v2h2.5v-2H10zM3.5 11h9V9h-9v2zm0-3.5h9v-2h-9v2zM4 13h4v1H4v-1zm6.5 0H12v1h-1.5v-1zM4 9.5h8v1H4v-1zM4 6h8v1H4V6z" })));
exports.SvgForms = SvgForms;
exports.default = SvgForms;
