"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDraw = void 0;
const react_1 = __importDefault(require("react"));
const SvgDraw = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M16 1.976a.668.668 0 01-.208.52l-.936.936-2.236-2.34.936-.884a.754.754 0 011.04 0l1.3 1.3a1.242 1.242 0 01.104.468zm-3.744-.52L7.68 6.032V8.32h2.288l4.576-4.576zm-2.6 6.136H9.08v-.728h-.727v-.575l.52-.52 1.303 1.303zm-.104-2.031c-.055.055-.048.055-.104.055s-.104 0-.104-.104a.201.201 0 01.049-.104l2.967-2.96c.049-.056.049-.056.104-.056.055 0 .104 0 .104.104a.201.201 0 01-.048.104zM.885 15.138a.506.506 0 01-.208-.045.5.5 0 01-.246-.663c.414-.908 1.54-.85 2.531-.804.643.033 1.442.07 1.574-.22.133-.291-.42-.87-.864-1.333-.687-.72-1.465-1.532-1.05-2.44.414-.909 1.539-.854 2.531-.802.64.033 1.44.072 1.573-.22a.5.5 0 11.909.417c-.414.907-1.538.852-2.532.802-.64-.033-1.439-.073-1.572.218s.42.87.864 1.333c.687.718 1.465 1.533 1.05 2.44s-1.542.85-2.531.804c-.644-.032-1.44-.069-1.574.221a.5.5 0 01-.455.292z" })));
exports.SvgDraw = SvgDraw;
exports.default = SvgDraw;
