"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgNews = void 0;
const react_1 = __importDefault(require("react"));
const SvgNews = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M3 0v13H2V7H0v6a2.006 2.006 0 002 2h11.5a2.5 2.5 0 002.5-2.5V0zm2 2h4v5H5zm9 10H5v-1h9zm0-2H5V9h9zm0-3h-4V6h4zm0-2h-4V4h4zm0-2h-4V2h4z" })));
exports.SvgNews = SvgNews;
exports.default = SvgNews;
