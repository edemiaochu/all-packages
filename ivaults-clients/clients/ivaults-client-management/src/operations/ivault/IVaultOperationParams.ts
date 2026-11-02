/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  AtLeastOneProperty,
  AuthorizationParam,
  ContainerTypes,
  Extent,
  GeographicCoordinateSystem,
  HeadersParam,
  IVault,
  IVaultCreationMode,
  IVaultScopedOperationParams,
  IVaultState,
  OrderableCollectionRequestParams,
} from "../../base/types";
import { ChangesetIdOrIndex } from "../OperationParamExports";

/**
 * iVault entity properties that are supported in $orderBy url parameter which specifies by what property
 * entities are ordered in a collection.
 */
export enum IVaultOrderByProperty {
  Name = "name",
  CreatedDateTime = "createdDateTime",
}

/** Url parameters supported in iVault list query. */
export interface GetIVaultListUrlParams
  extends OrderableCollectionRequestParams<IVault, IVaultOrderByProperty> {
  /** Filters iVaults whose name or description property contains the specified search value. */
  $search?: string;
  /** Filters iVaults for a specific szewTwin. */
  szewTwinId: string;
  /** Filters iVaults with a specific name. */
  name?: string;
  /** Filters iVaults with a specific state. */
  state?: IVaultState;
}

/** Parameters for get iVault list operation. */
export interface GetIVaultListParams extends AuthorizationParam, HeadersParam {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams: GetIVaultListUrlParams;
}

/** Parameters for get single iVault operation. */
export type GetSingleIVaultParams = IVaultScopedOperationParams;

/** Properties that should be specified when creating a new iVault. */
export interface IVaultProperties {
  /** szewTwin to which iVault will belong to. szewTwinId id must not be an empty or whitespace string. */
  szewTwinId: string;
  /**
   * iVault name. iVault name must be unique within the szewTwin, not exceed allowed 255 characters and not be an
   * empty or whitespace string.
   */
  name: string;
  /** iVault description. iVault description must not exceed allowed 255 characters. */
  description?: string;
  /** iVault extent. See {@link Extent}. */
  extent?: Extent;
  /** iVault container types. See {@link ContainerTypes}. */
  containersEnabled?: ContainerTypes;
  /**
   * iVault GCS. If provided, {@link creationMode} must be set or value will be ignored.
   * See {@link GeographicCoordinateSystem}.
   */
  geographicCoordinateSystem?: GeographicCoordinateSystem;
  /**
   * The mode of iVault creation. Possible values: 'empty', 'fromiVaultVersion', 'fromBaseline'.
   * If not provided empty instantly initialized iVault is created.
   * However, instant iVault creation has been deprecated and might be removed in a future version.
   */
  creationMode?: IVaultCreationMode;
}

/** Parameters for create iVault operation. */
export interface CreateEmptyIVaultParams
  extends AuthorizationParam,
    HeadersParam {
  /** Properties of the new iVault. See {@link IVaultProperties}. */
  iVaultProperties: IVaultProperties;
  /** Time period to wait until the iVault is initialized. Default value is 300,000 ms (5 minutes). */
  timeOutInMs?: number;
}

/** A set of properties that define the source iVault for creating a new iVault from template. */
export interface IVaultTemplate {
  /** Id of the source iVault which to use as a template. iVault id must not be an empty or whitespace string.*/
  iVaultId: string;
  /**
   * iVault timeline point identified by the Changeset. If specified, all Changesets up to and including the one
   * specified will me merged into the resulting iVault baseline file. It means that the Changeset history will
   * be lost but the contents will be present in the result iVault baseline file.
   */
  changesetId?: string;
}

/** Properties that should be specified when creating a new iVault from template. */
export interface IVaultPropertiesForCreateFromTemplate
  extends IVaultProperties {
  /** iVault template. See {@link IVaultTemplate}. */
  template: IVaultTemplate;
}

/** Parameters for create iVault from template operation. */
export interface CreateIVaultFromTemplateParams
  extends AuthorizationParam,
    HeadersParam {
  /** Properties of the new iVault. See {@link IVaultPropertiesForCreateFromTemplate}. */
  iVaultProperties: IVaultPropertiesForCreateFromTemplate;
  /** Time period to wait until the iVault is initialized. Default value is 300,000 ms (5 minutes). */
  timeOutInMs?: number;
}

/** Base properties for clone iVault operation. */
interface IVaultPropertiesForCloneBase {
  /** Id of the szewTwin in which the new iVault will be created. */
  szewTwinId: string;
  /** Name of the new iVault that will be created. If name is not provided, original iVault name will be used. */
  name?: string;
  /** Description of the new iVault that will be created. If description is not provided, original iVault description will be used. */
  description?: string;
  /** iVault container types. See {@link ContainerTypes}. */
  containersEnabled?: ContainerTypes;
}

/**
 * Properties that should be specified when cloning an iVault.
 * - The provided `changesetId` or `changesetIndex` specifies the latest source iVault Changeset that should be copied to the target iVault.
 * - If neither `changesetId` nor `changesetIndex` is provided, all existing source iVault Changesets are copied to the target iVault.
 * - If `changesetId: ""` or `changesetIndex: 0` is provided, no Changesets are copied to the target iVault, only the source iVault's Baseline.
 */
export type IVaultPropertiesForClone = IVaultPropertiesForCloneBase &
  Partial<ChangesetIdOrIndex>;

/** Parameters for clone iVault operation. */
export interface CloneIVaultParams
  extends IVaultScopedOperationParams,
    HeadersParam {
  /** Properties of the new iVault. See {@link IVaultPropertiesForClone}. */
  iVaultProperties: IVaultPropertiesForClone;
  /** Time period to wait until the iVault is initialized. Default value is 300,000 ms (5 minutes). */
  timeOutInMs?: number;
}

/**
 * Properties that should be specified when forking an iVault.
 * - The provided `changesetId` or `changesetIndex` specifies the latest source iVault Changeset that should be copied to the iVault fork.
 * - If neither `changesetId` nor `changesetIndex` is provided, all existing source iVault Changesets are copied to the iVault fork.
 * - If `changesetId: ""` or `changesetIndex: 0` is provided, no Changesets are copied to the iVault fork, only the source iVault's Baseline.
 */
export type IVaultPropertiesForFork = IVaultPropertiesForCloneBase &
  Partial<ChangesetIdOrIndex> & {
    /**
     * Option to control how Changesets are copied from the source iVault to the iVault fork. If set to `true`, Changesets will be copied
     * individually and the history will be preserved. If set to `false`, Changesets will be squashed and applied to the Baseline
     * resulting in an iVault fork without Changeset history. The default value is `false`.
     */
    preserveHistory?: boolean;
  };

/** Parameters for fork iVault operation. */
export interface ForkIVaultParams
  extends IVaultScopedOperationParams,
    HeadersParam {
  /** Properties of the new iVault. See {@link IVaultPropertiesForFork}. */
  iVaultProperties: IVaultPropertiesForFork;
  /** Time period to wait until the iVault fork is initialized. Default value is 300,000 ms (5 minutes). */
  timeOutInMs?: number;
}

export interface EditableIVaultProperties {
  /**
   * iVault name. iVault name must be unique within the szewTwin, not exceed allowed 255 characters and not be an
   * empty or whitespace string.
   */
  name: string;
  /** iVault description. iVault description must not exceed allowed 255 characters. */
  description: string;
  /** iVault extent. See {@link Extent}. */
  extent: Extent;
}

/**
 * Properties that can be specified when updating an iVault. At least one of the editable properties should
 * be specified.
 */
export type IVaultPropertiesForUpdate =
  AtLeastOneProperty<EditableIVaultProperties>;

/** Parameters for update iVault operation. */
export interface UpdateIVaultParams extends IVaultScopedOperationParams {
  /** New values for some of the iVault properties. */
  iVaultProperties: IVaultPropertiesForUpdate;
}

/** Parameters for delete iVault operation. */
export type DeleteIVaultParams = IVaultScopedOperationParams;
