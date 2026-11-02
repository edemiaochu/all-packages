"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCloudUpload = void 0;
const react_1 = __importDefault(require("react"));
const SvgCloudUpload = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 7.02A3.057 3.057 0 0112.9 10h-1.063L9.379 6.433A1 1 0 008.563 6h-.007a1 1 0 00-.815.42L5.195 10H3.1A3.057 3.057 0 010 7.02a2.872 2.872 0 012.6-2.885v-.289a1.89 1.89 0 012-1.827 2.155 2.155 0 011.3.481A3.53 3.53 0 019.5 0a3.794 3.794 0 014 4.038v.289A2.617 2.617 0 0116 7.019zM8.556 7L5 12h2v4h3v-4h2z" })));
exports.SvgCloudUpload = SvgCloudUpload;
exports.default = SvgCloudUpload;
