"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgGrid = void 0;
const react_1 = __importDefault(require("react"));
const SvgGrid = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15 0H1a1 1 0 00-1 1v14a1 1 0 001 1h14a1 1 0 001-1V1a1 1 0 00-1-1zm-5 1v4H6V1zm0 5v4H6V6zM1 1h4v4H1zm0 5h4v4H1zm0 9v-4h4v4zm5 0v-4h4v4zm9 0h-4v-4h4zm0-5h-4V6h4zm0-5h-4V1h4z" })));
exports.SvgGrid = SvgGrid;
exports.default = SvgGrid;
