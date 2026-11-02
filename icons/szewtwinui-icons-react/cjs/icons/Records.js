"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgRecords = void 0;
const react_1 = __importDefault(require("react"));
const SvgRecords = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M1 15h14v-4H1zm5-3h1v1h2v-1h1v2H6zm-5-2h14V6H1zm5-3h1v1h2V7h1v2H6zM1 1v4h14V1zm9 3H6V2h1v1h2V2h1z" })));
exports.SvgRecords = SvgRecords;
exports.default = SvgRecords;
