"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgScreenshare = void 0;
const react_1 = __importDefault(require("react"));
const SvgScreenshare = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M.5 13a.5.5 0 11-.5.5.5.5 0 01.5-.5zm6.5.5A6.508 6.508 0 00.5 7a.5.5 0 000 1A5.507 5.507 0 016 13.5a.5.5 0 001 0zm-2 0A4.505 4.505 0 00.5 9a.5.5 0 000 1A3.504 3.504 0 014 13.5a.5.5 0 001 0zm-2 0A2.503 2.503 0 00.5 11a.5.5 0 000 1A1.502 1.502 0 012 13.5a.5.5 0 001 0zm12-.5V3H1v3H0V2h16v12H8v-1z", fillRule: "evenodd" })));
exports.SvgScreenshare = SvgScreenshare;
exports.default = SvgScreenshare;
