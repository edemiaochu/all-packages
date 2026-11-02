"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgTableOfContents = void 0;
const react_1 = __importDefault(require("react"));
const SvgTableOfContents = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M3 5H1V3h2zm12-2H5v2h10zM5 9H3V7h2zm10-2H7v2h8zM5 13H3v-2h2zm10-2H7v2h8z", fillRule: "evenodd" })));
exports.SvgTableOfContents = SvgTableOfContents;
exports.default = SvgTableOfContents;
