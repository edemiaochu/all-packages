"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSend = void 0;
const react_1 = __importDefault(require("react"));
const SvgSend = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15.003 0h-.005a.995.995 0 00-.512.14L.504 8.132A1 1 0 00.64 9.933l3.105 1.195L10.848 5.8a.25.25 0 01.339.365l-6.188 7.072V15a1 1 0 001.707.707l2.485-2.485 4.448 1.711a1 1 0 001.356-.856l.994-12.929A1 1 0 0015.003 0z" })));
exports.SvgSend = SvgSend;
exports.default = SvgSend;
