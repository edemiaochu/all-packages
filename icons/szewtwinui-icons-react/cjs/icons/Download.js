"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDownload = void 0;
const react_1 = __importDefault(require("react"));
const SvgDownload = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14 7h-4V0H6v7H2l6 5zm0 4v3H2v-3H0v5h16v-5z" })));
exports.SvgDownload = SvgDownload;
exports.default = SvgDownload;
