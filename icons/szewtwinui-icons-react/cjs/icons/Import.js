"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgImport = void 0;
const react_1 = __importDefault(require("react"));
const SvgImport = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M4 3.4h10v7h-2.2l-2.5 2H16v-11H2V7l2-1.6z" }),
    react_1.default.createElement("path", { d: "M0 13.3c1.7-1.7 3.7-3.1 7-3v2l5-4-5-4v2c-3.5 0-7 3.1-7 7" })));
exports.SvgImport = SvgImport;
exports.default = SvgImport;
