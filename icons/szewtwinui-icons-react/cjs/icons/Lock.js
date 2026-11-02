"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgLock = void 0;
const react_1 = __importDefault(require("react"));
const SvgLock = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13 7V4.71A4.71 4.71 0 008.29 0h-.57A4.74 4.74 0 003 4.72V7H2v9h12V7zM7.5 2h1A2.52 2.52 0 0111 4.51V7H5V4.5A2.5 2.5 0 017.5 2zm1.3 12H7.3l.2-2.2A1 1 0 017 11a1.08 1.08 0 011-1 1.08 1.08 0 011 1 .89.89 0 01-.5.8z" })));
exports.SvgLock = SvgLock;
exports.default = SvgLock;
