"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgProgressForwardCircular = void 0;
const react_1 = __importDefault(require("react"));
const SvgProgressForwardCircular = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M6.53 12.53l-1.06-1.06L8.939 8 5.47 4.53l1.06-1.06L11.06 8l-4.53 4.53z" }),
    react_1.default.createElement("path", { d: "M8 1.5A6.5 6.5 0 111.5 8 6.507 6.507 0 018 1.5M8 0a8 8 0 108 8 8 8 0 00-8-8" })));
exports.SvgProgressForwardCircular = SvgProgressForwardCircular;
exports.default = SvgProgressForwardCircular;
