"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgRotateRight = void 0;
const react_1 = __importDefault(require("react"));
const SvgRotateRight = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7.6.4c2.8 0 5.3 1.5 6.6 3.8L16 2.4v5.2h-5.2L13 5.4C12 3.4 10 2 7.6 2c-3.3 0-6 2.7-6 6s2.7 6 6 6c2.6 0 4.8-1.7 5.7-4H15c-.9 3.2-3.8 5.6-7.4 5.6C3.4 15.6 0 12.2 0 8S3.4.4 7.6.4" })));
exports.SvgRotateRight = SvgRotateRight;
exports.default = SvgRotateRight;
