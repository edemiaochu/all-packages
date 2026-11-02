"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSortMenu = void 0;
const react_1 = __importDefault(require("react"));
const SvgSortMenu = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M4 10V2H2v8H0l3 5 3-5zm4-5h7v2H8zm0 3h6v2H8zm0 3h5v2H8zm0-9h8v2H8z" })));
exports.SvgSortMenu = SvgSortMenu;
exports.default = SvgSortMenu;
