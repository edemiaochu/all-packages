"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFolderOpened = void 0;
const react_1 = __importDefault(require("react"));
const SvgFolderOpened = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M3.07 7h12.19a.7.7 0 01.68 1l-1.66 5a1.53 1.53 0 01-1.35 1H.74a.7.7 0 01-.68-1l1.66-5a1.53 1.53 0 011.35-1z" }),
    react_1.default.createElement("path", { d: "M.77 7.68A2.54 2.54 0 013.07 6H14V5a1 1 0 00-1-1H6V3a1 1 0 00-1-1H1a1 1 0 00-1 1v7z" })));
exports.SvgFolderOpened = SvgFolderOpened;
exports.default = SvgFolderOpened;
