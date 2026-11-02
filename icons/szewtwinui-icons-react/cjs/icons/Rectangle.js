"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgRectangle = void 0;
const react_1 = __importDefault(require("react"));
const SvgRectangle = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13.5 11.5h-11v-7h11zM15 3H1v10h14V3z" })));
exports.SvgRectangle = SvgRectangle;
exports.default = SvgRectangle;
