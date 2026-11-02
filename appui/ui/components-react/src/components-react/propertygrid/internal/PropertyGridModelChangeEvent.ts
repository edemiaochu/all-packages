/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** @packageDocumentation
 * @module PropertyGrid
 */
import { BeEvent } from "@szewtwin/core-szewec";

/**
 * A signature for property grid model change listeners
 * @public
 */
export type PropertyGridModelChangeListener = () => void;

/**
 * An event broadcasted on property grid model changes
 * @public
 */
export class PropertyGridModelChangeEvent extends BeEvent<PropertyGridModelChangeListener> {}
