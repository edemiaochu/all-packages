"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgNew = void 0;
const react_1 = __importDefault(require("react"));
const SvgNew = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 5a1 1 0 01-1-1V1a1 1 0 012 0v3a1 1 0 01-1 1zM4.535 7a.997.997 0 01-.499-.134l-2.598-1.5a1 1 0 111-1.732l2.598 1.5A1 1 0 014.536 7zM1.94 12.5a1 1 0 01-.501-1.866l2.598-1.5a1 1 0 111 1.732l-2.598 1.5a.997.997 0 01-.499.134zM8 16a1 1 0 01-1-1v-3a1 1 0 012 0v3a1 1 0 01-1 1zm6.061-3.5a.995.995 0 01-.499-.134l-2.598-1.5a1 1 0 111-1.732l2.598 1.5a1 1 0 01-.5 1.866zM11.465 7a1 1 0 01-.501-1.866l2.598-1.5a1 1 0 111 1.732l-2.598 1.5a.995.995 0 01-.5.134z" })));
exports.SvgNew = SvgNew;
exports.default = SvgNew;
