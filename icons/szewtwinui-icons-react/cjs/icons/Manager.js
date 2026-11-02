"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgManager = void 0;
const react_1 = __importDefault(require("react"));
const SvgManager = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M10 10.7s.105 1.3-1.5 1.3h-1C5.879 12 6 10.7 6 10.7L0 8v6a.945.945 0 001 1h14a.945.945 0 001-1V8zM15 4h-3V2.5A1.538 1.538 0 0010.5 1h-5A1.538 1.538 0 004 2.5V4H1a.945.945 0 00-1 1v2l6.2 2.7A1.71 1.71 0 017.5 9h1a1.71 1.71 0 011.3.7L16 7V5a.945.945 0 00-1-1m-4 0H5V2.5a.472.472 0 01.5-.5h5a.472.472 0 01.5.5zm-3.5 6h1a.5.5 0 010 1h-1a.5.5 0 010-1" })));
exports.SvgManager = SvgManager;
exports.default = SvgManager;
