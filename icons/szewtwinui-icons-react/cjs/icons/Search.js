"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSearch = void 0;
const react_1 = __importDefault(require("react"));
const SvgSearch = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M11 9.7c.7-1 1.1-2.2 1.1-3.5.1-3.5-2.7-6.2-6-6.2C2.7 0 0 2.7 0 6.1s2.7 6.1 6.1 6.1c1.3 0 2.5-.4 3.5-1.1l4.9 4.9 1.4-1.4zm-5 .5c-2.3 0-4.1-1.8-4.1-4.1S3.7 2 6 2s4.1 1.8 4.1 4.1-1.8 4.1-4.1 4.1" })));
exports.SvgSearch = SvgSearch;
exports.default = SvgSearch;
