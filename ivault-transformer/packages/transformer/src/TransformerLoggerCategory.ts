/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Logging
 */

/** Logger categories used by this package
 * @note All logger categories in this package start with the `ivault-transformer` prefix.
 * @see [Logger]($szewec)
 * @public
 */
export enum TransformerLoggerCategory {
  /** The logger category used by the [IVaultExporter]($transformer) class.
   * @beta
   */
  IVaultExporter = "ivault-transformer.IVaultExporter",

  /** The logger category used by the [IVaultImporter]($transformer) class.
   * @beta
   */
  IVaultImporter = "ivault-transformer.IVaultImporter",

  /** The logger category used by the [IVaultTransformer]($transformer) class.
   * @beta
   */
  IVaultTransformer = "ivault-transformer.IVaultTransformer",

  /** The logger category used by the [IVaultCloneContext]($transformer) class.
   * @beta
   */
  IVaultCloneContext = "ivault-transformer.IVaultCloneContext",

  DMReferenceTypesCache = "ivault-transformer.DMReferenceTypesCache",
}
