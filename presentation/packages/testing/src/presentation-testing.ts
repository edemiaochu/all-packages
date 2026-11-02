/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/**
 * @module Hierarchies
 *
 * @docs-group-description Hierarchies
 * Types for testing hierarchies.
 */
export * from "./presentation-testing/HierarchyBuilder.js";

/**
 * @module Content
 *
 * @docs-group-description Content
 * Types for testing content.
 */
export * from "./presentation-testing/ContentBuilder.js";

/**
 * @module Helpers
 *
 * @docs-group-description Helpers
 * Various test helpers.
 */
export {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  HierarchyCacheMode,
  PresentationBackendProps,
  PresentationTestingInitProps,
  initialize,
  terminate,
} from "./presentation-testing/Helpers.js";
export {
  createFileNameFromString,
  getTestOutputDir,
  limitFilePathLength,
  setTestOutputDir,
  setupOutputFileLocation,
} from "./presentation-testing/FilenameUtils.js";

/**
 * @module IVault
 *
 * @docs-group-description IVault
 * Utilities for creating test iVaults that can be used to exercise presentation rules.
 */
export * from "./presentation-testing/IVaultUtilities.js";

// TODO: remove when szewtwinjs-core 4.x is dropped.
/**
 * Presentation manager working mode.
 * @public
 * @deprecated in 3.x. The attribute is not used by [[PresentationManager]] anymore
 */
export enum PresentationManagerMode {
  /**
   * Presentation manager assumes iVaults are opened in read-only mode and avoids doing some work
   * related to reacting to changes in iVaults.
   */
  ReadOnly,

  /**
   * Presentation manager assumes iVaults are opened in read-write mode and it may need to
   * react to changes. This involves some additional work and gives slightly worse performance.
   */
  ReadWrite,
}
