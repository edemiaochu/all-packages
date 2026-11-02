"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPrint = void 0;
const react_1 = __importDefault(require("react"));
const SvgPrint = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M5 12h5v1H5zM4 1h8v2h1V1a.945.945 0 00-1-1H4a.945.945 0 00-1 1v2h1zm1 9h6v1H5zm10-6H1a.945.945 0 00-1 1v6a.945.945 0 001 1h2v3a.945.945 0 001 1h8a.945.945 0 001-1v-3h2a.945.945 0 001-1V5a.945.945 0 00-1-1m-3 11H4V9h8zm2-8a.945.945 0 01-1-1 1 1 0 012 0 .945.945 0 01-1 1" })));
exports.SvgPrint = SvgPrint;
exports.default = SvgPrint;
