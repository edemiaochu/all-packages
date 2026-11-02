"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSortDown = void 0;
const react_1 = __importDefault(require("react"));
const SvgSortDown = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7 0v12.7L3.2 9 2 10.2 8 16l1.2-1.2 4.8-4.6L12.8 9 9 12.7V0z" })));
exports.SvgSortDown = SvgSortDown;
exports.default = SvgSortDown;
