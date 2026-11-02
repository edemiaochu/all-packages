"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgAlignCenterHorizontal = void 0;
const react_1 = __importDefault(require("react"));
const SvgAlignCenterHorizontal = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { fillRule: "evenodd", d: "M13 9H8V7h3V3H8V0H7v3H4v4h3v2H2v4h5v3h1v-3h5V9z" })));
exports.SvgAlignCenterHorizontal = SvgAlignCenterHorizontal;
exports.default = SvgAlignCenterHorizontal;
