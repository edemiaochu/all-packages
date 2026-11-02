/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Id64String } from "@szewtwin/core-szewec";
import {
  ElementOwnsExternalSourceAspects,
  ExternalSourceAspect,
  IVaultDb,
} from "@szewtwin/core-backend";
import { IVault } from "@szewtwin/core-common";
import type { TargetScopeProvenanceJsonProps } from "./IVaultTransformer";
import type { IVaultCloneContext } from "./IVaultCloneContext";
import { ProvenanceManager } from "./ProvenanceManager";

/** @internal */
export type SyncType = "not-sync" | "forward" | "reverse";

/**
 * Encapsulates sync direction determination logic.
 * Given a source and target iVault, resolves whether the transformation is
 * a forward sync, reverse sync, or not a sync at all.
 * @internal
 */
export class SyncTypeResolver {
  public static noEsaSyncDirectionErrorMessage =
    "Couldn't find an external source aspect to determine sync direction. This often means that the master->branch relationship has not been established. Consider running the transformer with wasSourceIVaultCopiedToTarget set to true.";

  public readonly context: IVaultCloneContext;

  private _syncType?: SyncType;
  private readonly _targetScopeElementId: Id64String;
  private readonly _isProvenanceInitTransform: boolean;
  private readonly _isSyncTransform: boolean;

  public constructor(
    context: IVaultCloneContext,
    targetScopeElementId: Id64String,
    isProvenanceInitTransform: boolean = false,
    isSyncTransform: boolean = false
  ) {
    this.context = context;
    this._targetScopeElementId = targetScopeElementId;
    this._isProvenanceInitTransform = isProvenanceInitTransform;
    this._isSyncTransform = isSyncTransform;
  }

  /**
   * Determines the sync direction "forward" or "reverse" of a given sourceDb and targetDb by looking for the scoping ESA.
   * If the sourceDb's iVaultId is found as the identifier of the expected scoping ESA in the targetDb, then it is a forward synchronization.
   * If the targetDb's iVaultId is found as the identifier of the expected scoping ESA in the sourceDb, then it is a reverse synchronization.
   * @note This is a standalone utility that does not depend on instance state.
   * @throws if no scoping ESA can be found in either the sourceDb or targetDb which describes a master branch relationship between the two databases.
   * @returns "forward" or "reverse"
   */
  public static async determineSyncType(
    sourceDb: IVaultDb,
    targetDb: IVaultDb,
    targetScopeElementId: Id64String
  ): Promise<"forward" | "reverse"> {
    const aspectProps = {
      id: undefined as string | undefined,
      version: undefined as string | undefined,
      classFullName: ExternalSourceAspect.classFullName,
      element: {
        id: targetScopeElementId,
        relClassName: ElementOwnsExternalSourceAspects.classFullName,
      },
      scope: { id: IVault.rootSubjectId },
      identifier: sourceDb.iVaultId,
      kind: ExternalSourceAspect.Kind.Scope,
      jsonProperties: undefined as TargetScopeProvenanceJsonProps | undefined,
    };
    // First check if the targetDb is the branch (branch is the provenanceDb)
    const esaPropsFromTargetDb =
      await ProvenanceManager.queryScopeExternalSourceAspect(
        targetDb,
        aspectProps
      );
    if (esaPropsFromTargetDb !== undefined) {
      return "forward";
    }

    // Now check if the sourceDb is the branch
    aspectProps.identifier = targetDb.iVaultId;
    const esaPropsFromSourceDb =
      await ProvenanceManager.queryScopeExternalSourceAspect(
        sourceDb,
        aspectProps
      );

    if (esaPropsFromSourceDb !== undefined) {
      return "reverse";
    }
    throw new Error(SyncTypeResolver.noEsaSyncDirectionErrorMessage);
  }

  /** Returns the sync type, lazily resolving it on first call. */
  public async getSyncType(): Promise<SyncType> {
    if (this._syncType === undefined) {
      if (this._isProvenanceInitTransform) {
        this._syncType = "forward";
      } else if (!this._isSyncTransform) {
        this._syncType = "not-sync";
      } else {
        this._syncType = await SyncTypeResolver.determineSyncType(
          this.context.sourceDb,
          this.context.targetDb,
          this._targetScopeElementId
        );
      }
    }
    return this._syncType;
  }

  private async getIsReverseSynchronization(): Promise<boolean> {
    return (await this.getSyncType()) === "reverse";
  }

  private async getIsForwardSynchronization(): Promise<boolean> {
    return (await this.getSyncType()) === "forward";
  }
}
