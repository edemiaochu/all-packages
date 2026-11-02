"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgHierarchyTree = void 0;
const react_1 = __importDefault(require("react"));
const SvgHierarchyTree = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M10.32 5.68H5.66V1.022h4.66v4.66zM0 14.98h4.66v-4.66H0zm5.66 0h4.66v-4.66H5.66zm5.68-4.66v4.66H16v-4.66zM2.585 8.24h5.15v1.559h.51v-1.56h5.17v1.559h.51v-2.07h-5.68v-1.53h-.51V7.73H2.068v2.069h.516z" })));
exports.SvgHierarchyTree = SvgHierarchyTree;
exports.default = SvgHierarchyTree;
