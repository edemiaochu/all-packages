"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgProgressForward = void 0;
const react_1 = __importDefault(require("react"));
const SvgProgressForward = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M5.57 15.5l-1.756-1.756L9.558 8 3.814 2.256 5.57.5l7.5 7.5z" })));
exports.SvgProgressForward = SvgProgressForward;
exports.default = SvgProgressForward;
