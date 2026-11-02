"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgUpload = void 0;
const react_1 = __importDefault(require("react"));
const SvgUpload = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M2 5h4v7h4V5h4L8 0zm12 6v3H2v-3H0v5h16v-5z" })));
exports.SvgUpload = SvgUpload;
exports.default = SvgUpload;
