"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCrop = void 0;
const react_1 = __importDefault(require("react"));
const SvgCrop = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M2 2V0h2v12h12v2h-2v2h-2v-2H2V4H0V2z" }),
    react_1.default.createElement("path", { d: "M14 11V2H5v2h7v7z" })));
exports.SvgCrop = SvgCrop;
exports.default = SvgCrop;
