"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPaste = void 0;
const react_1 = __importDefault(require("react"));
const SvgPaste = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13 2h-1v2H4V2H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1zM9 12v1H4v-1zm-5-2V9h8v1zm8-4v1H4V6zm-1-3H5V1.75A.75.75 0 015.75 1H7a1 1 0 012 0h1.25a.75.75 0 01.75.75z" })));
exports.SvgPaste = SvgPaste;
exports.default = SvgPaste;
