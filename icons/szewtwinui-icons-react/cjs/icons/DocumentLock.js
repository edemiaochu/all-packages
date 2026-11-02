"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDocumentLock = void 0;
const react_1 = __importDefault(require("react"));
const SvgDocumentLock = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 16H0V0h8v4h4v2a3.003 3.003 0 00-3 3v1H8v6zM9 0v3h3zm6 11V9a2.006 2.006 0 00-2-2h-1a2.006 2.006 0 00-2 2v2H9v5h7v-5zm-2.15 2.26L13.1 15h-1.2l.25-1.74a.7.7 0 01-.35-.56.7.7 0 011.4 0 .623.623 0 01-.35.56zM14 11h-3V9a1.001 1.001 0 011-1h1a1.001 1.001 0 011 1z" })));
exports.SvgDocumentLock = SvgDocumentLock;
exports.default = SvgDocumentLock;
