/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Utilities
 */
import type { Listener } from "@szewtwin/core-szewec";

/**
 * Retrieves the type of the callback function for an event type like `BeEvent`.
 * @note `ListenerType` is available in `@szewtwin/core-szewec@^4.8.0`
 * @internal
 */
export type ListenerType<
  TEvent extends {
    addListener(listener: Listener): () => void;
  }
> = TEvent extends {
  addListener(listener: infer TListener): () => void;
}
  ? TListener
  : never;
