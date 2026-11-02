"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgStatusError = void 0;
const react_1 = __importDefault(require("react"));
const SvgStatusError = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M9 12H7v-2h2v2zm0-3H7V4h2v5zm2.314-9H4.686L0 4.686v6.628L4.686 16h6.628L16 11.314V4.686L11.314 0z" })));
exports.SvgStatusError = SvgStatusError;
exports.default = SvgStatusError;
