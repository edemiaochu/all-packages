"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCopy = void 0;
const react_1 = __importDefault(require("react"));
const SvgCopy = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M5 10H3a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v2h1V2a2 2 0 00-2-2H3a2 2 0 00-2 2v7a2 2 0 002 2h2zm8-4a1 1 0 011 1v7a1 1 0 01-1 1H8a1 1 0 01-1-1V7a1 1 0 011-1zm0-1H8a2 2 0 00-2 2v7a2 2 0 002 2h5a2 2 0 002-2V7a2 2 0 00-2-2z" })));
exports.SvgCopy = SvgCopy;
exports.default = SvgCopy;
