"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgGoToStart = void 0;
const react_1 = __importDefault(require("react"));
const SvgGoToStart = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M12.222 4a.76.76 0 01.39.108A.804.804 0 0113 4.8v6.4a.804.804 0 01-.387.692.76.76 0 01-.777.003l-5.444-3.2a.811.811 0 010-1.39l5.444-3.2A.76.76 0 0112.222 4zM5 3a1 1 0 011 1v8a1 1 0 01-1 1 1 1 0 01-1-1V4a1 1 0 011-1z" })));
exports.SvgGoToStart = SvgGoToStart;
exports.default = SvgGoToStart;
