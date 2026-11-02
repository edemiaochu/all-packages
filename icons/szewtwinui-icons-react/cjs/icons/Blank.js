"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgBlank = void 0;
const react_1 = __importDefault(require("react"));
const SvgBlank = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", ...props }));
exports.SvgBlank = SvgBlank;
exports.default = SvgBlank;
