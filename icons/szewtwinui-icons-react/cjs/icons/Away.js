"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgAway = void 0;
const react_1 = __importDefault(require("react"));
const SvgAway = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13.445 12.832L7 8.535V1h2v6.465l5.555 3.703z" })));
exports.SvgAway = SvgAway;
exports.default = SvgAway;
