"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDetails = void 0;
const react_1 = __importDefault(require("react"));
const SvgDetails = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13 0H3a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V1a1 1 0 00-1-1zM5 13H4v-1h1zm0-3H4V9h1zm0-3H4V6h1zm0-3H4V3h1zm7 9H7v-1h5zm0-3H7V9h5zm0-3H7V6h5zm0-3H7V3h5z" })));
exports.SvgDetails = SvgDetails;
exports.default = SvgDetails;
