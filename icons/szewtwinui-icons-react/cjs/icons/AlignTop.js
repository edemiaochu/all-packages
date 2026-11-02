"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgAlignTop = void 0;
const react_1 = __importDefault(require("react"));
const SvgAlignTop = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M0 1h16v1H0zm3 2h4v11H3zm6 0h4v7H9z", fillRule: "evenodd" })));
exports.SvgAlignTop = SvgAlignTop;
exports.default = SvgAlignTop;
