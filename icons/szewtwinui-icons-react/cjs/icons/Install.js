"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgInstall = void 0;
const react_1 = __importDefault(require("react"));
const SvgInstall = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15.11 2H10v1h5v8H1V3h5V2H1a.961.961 0 00-1 1v9a1.06 1.06 0 001 1h6v2c-.6.09-1.7 1-1 1h4c.7 0-.41-.91-1-1v-2h6a.975.975 0 001-.96V3a.95.95 0 00-.89-1zM11 6H9V0H7v6H5l3 4z" })));
exports.SvgInstall = SvgInstall;
exports.default = SvgInstall;
