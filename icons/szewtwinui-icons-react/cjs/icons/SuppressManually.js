"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSuppressManually = void 0;
const react_1 = __importDefault(require("react"));
const SvgSuppressManually = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7.913 9.477L1.701 15.69a.961.961 0 01-1.359 0l-.06-.06a.961.961 0 010-1.36l6.212-6.212L5.126 6.69l4.279-4.28 1.367 1.367.25-.25a.961.961 0 011.359 0l.06.062a.961.961 0 010 1.359l-.249.25 1.492 1.49-4.279 4.28zM4.361 6.435l4.841-4.842A.916.916 0 107.907.298L3.065 5.139a.916.916 0 001.296 1.296zm11.37.392a.916.916 0 00-1.295 0L9.595 11.67a.916.916 0 001.295 1.295l4.842-4.841a.916.916 0 000-1.296z" })));
exports.SvgSuppressManually = SvgSuppressManually;
exports.default = SvgSuppressManually;
