/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module IVault
 */

import { IVaultDb } from "@szewtwin/core-backend";
import { Id64String } from "@szewtwin/core-szewec";
import {
  BisCodeSpec,
  Code,
  CodeScopeProps,
  CodeSpec,
  ElementAspectProps,
  ElementProps,
  ModelProps,
  RelationshipProps,
} from "@szewtwin/core-common";
import { TestIVaultBuilder } from "./IVaultUtilities.js";

/**
 * Default implementation of the IVault builder interface.
 * @internal
 */
export class TestIVaultBuilderImpl implements TestIVaultBuilder {
  private _iVault: IVaultDb;

  constructor(iVault: IVaultDb) {
    this._iVault = iVault;
  }

  public insertModel<TProps extends ModelProps>(props: TProps): Id64String {
    return this._iVault.models.insertModel(props);
  }

  public insertElement<TProps extends ElementProps>(props: TProps): Id64String {
    return this._iVault.elements.insertElement(props);
  }

  public insertAspect<TProps extends ElementAspectProps>(props: TProps): Id64String {
    return this._iVault.elements.insertAspect(props);
  }

  public insertRelationship<TProps extends RelationshipProps>(props: TProps): Id64String {
    return this._iVault.relationships.insertInstance(props);
  }

  public createCode(scopeModelId: CodeScopeProps, codeSpecName: BisCodeSpec, codeValue: string): Code {
    const codeSpec: CodeSpec = this._iVault.codeSpecs.getByName(codeSpecName);
    return new Code({ spec: codeSpec.id, scope: scopeModelId, value: codeValue });
  }

  public async importSchema(schemaXml: string) {
    await this._iVault.importSchemaStrings([schemaXml]);
  }
}
