"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgList = void 0;
const react_1 = __importDefault(require("react"));
const SvgList = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M2 2a.945.945 0 01-1 1 .945.945 0 01-1-1 .945.945 0 011-1 1.002 1.002 0 011 1m0 4a.945.945 0 01-1 1 1.002 1.002 0 01-1-1 .945.945 0 011-1 1.002 1.002 0 011 1m0 4a.945.945 0 01-1 1 1.002 1.002 0 01-1-1 .945.945 0 011-1 1.002 1.002 0 011 1m0 4a.945.945 0 01-1 1 1.002 1.002 0 01-1-1 .945.945 0 011-1 1.075 1.075 0 011 1M4 1h12v2H4zm0 4h12v2H4zm0 4h12v2H4zm0 4h12v2H4z" })));
exports.SvgList = SvgList;
exports.default = SvgList;
