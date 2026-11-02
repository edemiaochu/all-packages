"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCompare = void 0;
const react_1 = __importDefault(require("react"));
const SvgCompare = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8.6 2.4h4L9.8 7.6v.3c0 1.7 1.4 3 3.1 3s3.1-1.4 3.1-3v-.3l-2.8-5.2h.4v-.5H2.4v.5h.4L0 7.6v.3c0 1.7 1.4 3 3.1 3s3.1-1.4 3.1-3v-.3L3.4 2.4h4.1v9.2h-2v1h5.1v-1h-2zm-8 5.2l2.5-4.7 2.5 4.7zm12.3-4.7l2.5 4.7h-5z" })));
exports.SvgCompare = SvgCompare;
exports.default = SvgCompare;
