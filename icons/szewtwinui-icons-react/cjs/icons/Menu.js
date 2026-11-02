"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgMenu = void 0;
const react_1 = __importDefault(require("react"));
const SvgMenu = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", ...props },
    react_1.default.createElement("path", { d: "M0 12h16v2H0v-2zm0-5h16v2H0V7zm0-5h16v2H0V2z", fillRule: "evenodd", fill: "var(--iui-color-icon-muted, currentColor)" })));
exports.SvgMenu = SvgMenu;
exports.default = SvgMenu;
