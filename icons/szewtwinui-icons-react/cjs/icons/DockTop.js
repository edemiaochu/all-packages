"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDockTop = void 0;
const react_1 = __importDefault(require("react"));
const SvgDockTop = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M0 2v12h16V2zm15 11H1V7h14z" })));
exports.SvgDockTop = SvgDockTop;
exports.default = SvgDockTop;
