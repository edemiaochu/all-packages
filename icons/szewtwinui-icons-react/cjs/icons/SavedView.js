"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSavedView = void 0;
const react_1 = __importDefault(require("react"));
const SvgSavedView = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15 0H1a1 1 0 00-1 1v14a1 1 0 001 1h14a1 1 0 001-1V1a1 1 0 00-1-1zm0 11l-4 4H5l-4-4V5l4-4h6l4 4v6zm-13-.5l2.5-3 2.5 3H2zm5.768-.64l.534.64H14l-4.5-6-2.936 3.915L7.768 9.86zM2 11h12l-1 1H3l-1-1z" })));
exports.SvgSavedView = SvgSavedView;
exports.default = SvgSavedView;
