"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgUserRestricted = void 0;
const react_1 = __importDefault(require("react"));
const SvgUserRestricted = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7 9.929V13H.712c-.244 0-.488-.08-.651-.316-.081-.159-.081-.396 0-.633l1.465-3.243a.627.627 0 01.326-.317L4.13 7.305h.163c.65.474 1.396.813 2.21.813.814 0 1.534-.339 2.185-.813h.163l.51.263L7 9.928zm-.509-3.017c1.628 0 2.93-1.564 2.93-3.456C9.421.823 8.12 0 6.491 0c-1.628 0-2.93.823-2.93 3.456 0 1.892 1.302 3.456 2.93 3.456zM14.5 11.24h-5v1.5h5v-1.5zm1.5-.897v3.314L13.657 16h-3.314L8 13.657v-3.314L10.343 8h3.314L16 10.343z" })));
exports.SvgUserRestricted = SvgUserRestricted;
exports.default = SvgUserRestricted;
