"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgArchive = void 0;
const react_1 = __importDefault(require("react"));
const SvgArchive = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M11 7v2H5V7H0v7h16V7zM6 7h4v1H6m5-8v2H5V0H0v6h16V0zM6 0h4v1H6" })));
exports.SvgArchive = SvgArchive;
exports.default = SvgArchive;
