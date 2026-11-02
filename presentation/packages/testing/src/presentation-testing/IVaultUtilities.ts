/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module IVault
 */

import { IVaultDb, SnapshotDb } from "@szewtwin/core-backend";
import { Id64String } from "@szewtwin/core-szewec";
import {
  BisCodeSpec,
  Code,
  CodeScopeProps,
  ElementAspectProps,
  ElementProps,
  ModelProps,
  RelationshipProps,
} from "@szewtwin/core-common";
import { IVaultConnection } from "@szewtwin/core-frontend";
import { createFileNameFromString, setupOutputFileLocation } from "./FilenameUtils.js";
import { TestIVaultBuilderImpl } from "./IVaultBuilderImpl.js";

/**
 * Interface for IVault builder pattern. Used for building IVaults to test rulesets.
 * @beta
 */
export interface TestIVaultBuilder {
  /** Insert a model into the builder's iVault */
  insertModel<TProps extends ModelProps>(props: TProps): Id64String;
  /** Insert an element into the builder's iVault */
  insertElement<TProps extends ElementProps>(props: TProps): Id64String;
  /** Insert an element aspect into the specified element */
  insertAspect<TProps extends ElementAspectProps>(props: TProps): Id64String;
  /**
   * Insert a relationship between two instances. The relationship is expected to be a subclass
   * of `BisCore:ElementRefersToElements` or `BisCore:ElementDrivesElement`.
   */
  insertRelationship<TProps extends RelationshipProps>(props: TProps): Id64String;
  /**
   * Create code for specified element.
   * Code value has to be unique within its scope (see [Codes documentation page]($docs/bis/guide/fundamentals/codes.md)).
   */
  createCode(scopeModelId: CodeScopeProps, codeSpecName: BisCodeSpec, codeValue: string): Code;
  /**
   * Import an DMSchema in a form of XML string into the builder's iVault.
   */
  importSchema(schemaXml: string): Promise<void>;
}

/**
 * Type definition for test context compatible with Mocha test context
 * @beta
 */
interface TestContext {
  test: { fullTitle: () => string } | undefined;
}

/**
 * Function that creates an iVault and returns a connection to it.
 * @param name Name of test IVault
 * @param cb Callback function that receives an [[TestIVaultBuilder]] to fill the iVault with data
 * @beta
 * @deprecated in 4.x. Use an overload with `cb` returning a promise.
 */
export async function buildTestIVault(
  name: string,
  cb: (builder: TestIVaultBuilder) => void,
): Promise<IVaultConnection>;
/**
 * Function that creates an iVault and returns a connection to it.
 * @param name Name of test IVault
 * @param cb Callback function that receives an [[TestIVaultBuilder]] to fill the iVault with data
 * @beta
 */
export async function buildTestIVault(
  name: string,
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  cb: (builder: TestIVaultBuilder) => Promise<void>,
): Promise<IVaultConnection>;
/**
 * Function that creates an iVault and returns a connection to it.
 * @param context test context to generate iVault name from
 * @param cb Callback function that receives an [[TestIVaultBuilder]] to fill the iVault with data
 * @beta
 * @deprecated in 4.x. Use an overload with `cb` returning a promise.
 */
export async function buildTestIVault(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  context: TestContext,
  cb: (builder: TestIVaultBuilder) => void,
): Promise<IVaultConnection>;
/**
 * Function that creates an iVault and returns a connection to it.
 * @param context test context to generate iVault name from
 * @param cb Callback function that receives an [[TestIVaultBuilder]] to fill the iVault with data
 * @beta
 */
export async function buildTestIVault(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  context: TestContext,
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  cb: (builder: TestIVaultBuilder) => Promise<void>,
): Promise<IVaultConnection>;
export async function buildTestIVault(
  nameParam: string | TestContext,
  cb: (builder: TestIVaultBuilder) => void | Promise<void>,
): Promise<IVaultConnection> {
  const name = typeof nameParam === "string" ? nameParam : createFileNameFromString(nameParam.test!.fullTitle());
  const outputFile = setupOutputFileLocation(`${name}.bim`);
  const db = SnapshotDb.createEmpty(outputFile, { rootSubject: { name } });
  const builder = new TestIVaultBuilderImpl(db);
  try {
    await cb(builder);
  } finally {
    db.saveChanges("Created test IVault");
    db.close();
  }
  return TestIVaultConnection.openFile(outputFile);
}

/**
 * Implementation of `IVaultConnection` that allows opening local files in tests.
 * @beta
 */
/* c8 ignore start */
export class TestIVaultConnection extends IVaultConnection {
  // This was added based on this: https://github.com/szewTwin/szewtwinjs-core/pull/7171/files#diff-9d26b04e7ae074b911fb87be3425360d7bd55a7c9f947f5aed1ba36d359f01eb
  constructor(private readonly _db: IVaultDb) {
    // eslint-disable-next-line @szewtwin/no-internal
    super(_db.getConnectionProps());
    IVaultConnection.onOpen.raiseEvent(this);
  }

  public override get isClosed(): boolean {
    // eslint-disable-next-line @szewtwin/no-internal
    return !this._db.isOpen;
  }

  public override async close(): Promise<void> {
    this._db.close();
    this.onClose.raiseEvent(this);
    IVaultConnection.onClose.raiseEvent(this);
  }

  public static openFile(filePath: string): IVaultConnection {
    return new TestIVaultConnection(SnapshotDb.openFile(filePath));
  }
}
/* c8 ignore end */
