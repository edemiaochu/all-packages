"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgWindowMinimize = void 0;
const react_1 = __importDefault(require("react"));
const SvgWindowMinimize = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M0 16v-4.3l1.6 1.5 2.3-2.3 1.2 1.2-2.3 2.3L4.3 16m8.7-6H6V3h7zM7 9h5V4H7zM0 0v10h1V1h14v14H6v1h10V0z" })));
exports.SvgWindowMinimize = SvgWindowMinimize;
exports.default = SvgWindowMinimize;
