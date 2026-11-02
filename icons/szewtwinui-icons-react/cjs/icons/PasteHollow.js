"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPasteHollow = void 0;
const react_1 = __importDefault(require("react"));
const SvgPasteHollow = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13 2h-1v1h1v12H3V3h1V2H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1z" }),
    react_1.default.createElement("path", { d: "M9 1a1 1 0 10-2 0H5.75a.75.75 0 00-.75.75V3h6V1.75a.75.75 0 00-.75-.75zM4.5 4h7a.5.5 0 010 1h-7a.5.5 0 010-1zm0 6h5a.5.5 0 010 1h-5a.5.5 0 010-1zm0-2h7a.5.5 0 010 1h-7a.5.5 0 010-1zm0-2h6a.5.5 0 010 1h-6a.5.5 0 010-1zm0 6h6a.5.5 0 010 1h-6a.5.5 0 010-1z" })));
exports.SvgPasteHollow = SvgPasteHollow;
exports.default = SvgPasteHollow;
