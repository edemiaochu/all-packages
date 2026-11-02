"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCameraAnimation = void 0;
const react_1 = __importDefault(require("react"));
const SvgCameraAnimation = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 3l-4 2v-.5A1.538 1.538 0 0010.5 3h-9A1.538 1.538 0 000 4.5v7A1.538 1.538 0 001.5 13h9a1.538 1.538 0 001.5-1.5V11l4 2z" })));
exports.SvgCameraAnimation = SvgCameraAnimation;
exports.default = SvgCameraAnimation;
