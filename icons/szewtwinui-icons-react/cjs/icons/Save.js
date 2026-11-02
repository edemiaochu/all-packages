"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSave = void 0;
const react_1 = __importDefault(require("react"));
const SvgSave = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M1 1v12l2 2h12V1zm11 12a1 1 0 01-1 1H5a1 1 0 01-1-1v-3a1 1 0 011-1h6a1 1 0 011 1zm1-5.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-5a.5.5 0 01.5-.5h9a.5.5 0 01.5.5zM6 10a1 1 0 011 1v1a1 1 0 01-2 0v-1a1 1 0 011-1" })));
exports.SvgSave = SvgSave;
exports.default = SvgSave;
