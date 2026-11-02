"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgText = void 0;
const react_1 = __importDefault(require("react"));
const SvgText = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M0 .59a.6.6 0 01.606-.591h13.791a.6.6 0 01.607.591v2.813c0 .325-.183.591-.406.591a.88.88 0 01-.65-.54l-.525-.944a1.013 1.013 0 00-.85-.54H9.59a.6.6 0 00-.606.59v11.27a.848.848 0 00.58.76l1.866.373a.762.762 0 01.58.604c0 .24-.272.435-.605.435H3.6c-.333 0-.606-.196-.606-.435a.762.762 0 01.58-.604l1.835-.372a.848.848 0 00.58-.761V2.56a.6.6 0 00-.606-.591H2.431a1.013 1.013 0 00-.85.541l-.525.944a.88.88 0 01-.65.541C.183 3.995 0 3.729 0 3.404V.59z" })));
exports.SvgText = SvgText;
exports.default = SvgText;
