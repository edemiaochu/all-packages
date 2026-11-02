"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCollapse = void 0;
const react_1 = __importDefault(require("react"));
const SvgCollapse = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M4.5 6h4a.5.5 0 010 1h-4a.5.5 0 010-1zM13 4v1a1.001 1.001 0 011 1v7a1.001 1.001 0 01-1 1H6a1.001 1.001 0 01-1-1H4a2 2 0 002 2h7a2 2 0 002-2V6a2 2 0 00-2-2zm-3-2a1.001 1.001 0 011 1v7a1.001 1.001 0 01-1 1H3a1.001 1.001 0 01-1-1V3a1.001 1.001 0 011-1zm0-1H3a2 2 0 00-2 2v7a2 2 0 002 2h7a2 2 0 002-2V3a2 2 0 00-2-2z", fillRule: "evenodd" })));
exports.SvgCollapse = SvgCollapse;
exports.default = SvgCollapse;
