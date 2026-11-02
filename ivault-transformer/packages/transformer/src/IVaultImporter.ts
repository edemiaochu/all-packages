/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module iVaults
 */
import {
  Guid,
  Id64,
  Id64String,
  IVaultStatus,
  Logger,
} from "@szewtwin/core-szewec";
import {
  Base64EncodedString,
  DMJsNames,
  ElementAspectProps,
  ElementProps,
  EntityProps,
  IVault,
  IVaultError,
  ModelProps,
  RelatedElement,
  SubCategoryProps,
} from "@szewtwin/core-common";
import { TransformerLoggerCategory } from "./TransformerLoggerCategory";
import {
  ElementAspect,
  ElementMultiAspect,
  Entity,
  IVaultDb,
  Relationship,
  RelationshipProps,
  SourceAndTarget,
  SubCategory,
} from "@szewtwin/core-backend";
import type { RelationshipPropsForDelete } from "./IVaultTransformer";
import * as assert from "assert";
import { deleteElementTreeCascade } from "./ElementCascadingDeleter";
import { Property, PropertyType } from "@szewtwin/dmschema-metadata";

const loggerCategory: string = TransformerLoggerCategory.IVaultImporter;

/** Options provided to [[IVaultImporter.optimizeGeometry]] specifying post-processing optimizations to be applied to the iVault's geometry.
 * @beta
 */
export interface OptimizeGeometryOptions {
  /** If true, identify any [GeometryPart]($backend)s that are referenced exactly once. For each such part,
   * replace the reference in the element's geometry stream with the part's own geometry stream, then delete the part.
   */
  inlineUniqueGeometryParts?: boolean;
}

/** Options provided to the [[IVaultImporter]] constructor.
 * @beta
 */
export interface IVaultImportOptions {
  /** If `true` (the default), compute the projectExtents of the target iVault after elements are imported.
   * The computed projectExtents will either include or exclude *outliers* depending on the `excludeOutliers` flag that defaults to `false`.
   * @see [[IVaultImporter.autoExtendProjectExtents]]
   * @see [IVaultImporter Options]($docs/learning/transformer/index.md#IVaultImporter)
   */
  autoExtendProjectExtents?: boolean | { excludeOutliers: boolean };
  /** See [IVaultTransformOptions]($transformer) */
  preserveElementIdsForFiltering?: boolean;
  /** If `true`, simplify the element geometry for visualization purposes. For example, convert b-reps into meshes.
   * @default false
   */
  simplifyElementGeometry?: boolean;
  /**
   * Skip propagating changes made to the root subject, dictionaryModel and IVaultImporter._realityDataSourceLinkPartitionStaticId (0xe)
   * If it is set to false, changes to root elements are propagated, the root subject name gets changed and leads to the iVaultDb.name property being updated in .initializeiVaultDb
   * @default true
   */
  skipPropagateChangesToRootElements?: boolean;
}

/** Base class for importing data into an iVault.
 * @see [iVault Transformation and Data Exchange]($docs/learning/transformer/index.md)
 * @see [IVaultExporter]($transformer)
 * @see [IVaultTransformer]($transformer)
 * @beta
 */
export class IVaultImporter {
  /** The read/write target iVault. */
  public readonly targetDb: IVaultDb;

  /** resolved initialization options for the importer
   * @beta
   */
  public readonly options: Required<IVaultImportOptions>;

  private static _realityDataSourceLinkPartitionStaticId: Id64String = "0xe";

  /**
   * A map of conflicting element code values.
   * In cases where updating an element's code value results in a codeValue conflict, the element's code value will instead be updated to a random guid.
   * The actual codeValue will be stored in this ElementId->CodeValue map.
   * This is needed in cases where the duplicate target element is set to be deleted in the future, or when elements are switching code values with one another and we need a temporary code value.
   * To resolve code values to their intended values call [[IVaultImporter.resolveDuplicateCodeValues]].
   */
  private _duplicateCodeValueMap: Map<Id64String, string>;

  /**
   * A set of elementIds that the transformer adds to while exporting elements to indicate that the element already exists in the target.
   * Defaults to an empty set.
   * @note
   *
   * This is used as an optimization when `[[IVaultTransformOptions.preserveElementIdsForFiltering]]` is set to `true`
   * In normal cases where this option set to `false`,
   * the importer determines whether to insert or update based off of whether the ID is defined on the `elementProps` passed to `importElement`.
   * However, with `preserveElementIdsForFiltering` set to `true`, IDs are always set, so we can't determine insert/update like the normal case.
   * The transformer already knows if an element exists or not by the time `importElement` is called and pushes to this set with `markElementToUpdateForPreserveId`.
   * @note This set should stay small, as right after the transformer pushes to it, the importer will remove from the set.
   */
  private _elementsToUpdateDuringPreserveIds = new Set<Id64String>([]);

  /** The set of elements that should not be updated by this IVaultImporter.
   * Defaults to an empty set.
   * @note Adding an element to this set is typically necessary when remapping a source element to one that already exists in the target and already has the desired properties.
   */
  public readonly doNotUpdateElementIds = new Set<Id64String>([]);

  /** This set is ONLY used for elements that are always present even in an "empty" iVault. We will use this set to filter out changes to root elements if [[IVaultTransformOptions.skipPropagateChangesToRootElements]] is false. */
  private readonly _rootElementIds = new Set<Id64String>([
    IVault.rootSubjectId,
    IVault.dictionaryId,
    IVaultImporter._realityDataSourceLinkPartitionStaticId,
  ]);

  /** The number of entity changes before incremental progress should be reported via the [[onProgress]] callback. */
  public progressInterval: number = 1000;
  /** Tracks the current total number of entity changes. */
  private _progressCounter: number = 0;
  /** */
  private _modelPropertiesToIgnore = new Set<string>([
    "geometryGuid", // cannot compare GeometricModel.GeometryGuid values across iVaults
  ]);

  /** Construct a new IVaultImporter
   * @param targetDb The target IVaultDb
   * @param options The options that specify how the import should be done.
   */
  public constructor(targetDb: IVaultDb, options?: IVaultImportOptions) {
    this.targetDb = targetDb;
    this.options = {
      autoExtendProjectExtents: options?.autoExtendProjectExtents ?? true,
      preserveElementIdsForFiltering:
        options?.preserveElementIdsForFiltering ?? false,
      simplifyElementGeometry: options?.simplifyElementGeometry ?? false,
      skipPropagateChangesToRootElements:
        options?.skipPropagateChangesToRootElements ?? true,
    };
    this._duplicateCodeValueMap = new Map<Id64String, string>();
  }

  /**
   * Checks [[IVaultImportOptions.skipPropagateChangesToRootElements]], [[IVaultImporter.rootElementIds]], and [[IVaultImporter.doNotUpdateElementIds]] and returns true for 'do not update', false for do 'update'.
   */
  private doNotUpdateElement(elementId: Id64String): boolean {
    if (
      this.options.skipPropagateChangesToRootElements &&
      this._rootElementIds.has(elementId)
    )
      return true;
    if (this.doNotUpdateElementIds.has(elementId)) return true;
    return false;
  }

  /**
   * Marks an element so that it can be updated during import when [[IVaultTransformOptions.preserveElementIdsForFiltering]] is set to true.
   */
  public markElementToUpdateDuringPreserveIds(elementId: Id64String) {
    if (this._rootElementIds.has(elementId)) {
      return;
    }
    this._elementsToUpdateDuringPreserveIds.add(elementId);
  }

  /** Import the specified ModelProps (either as an insert or an update) into the target iVault. */
  public async importModel(modelProps: ModelProps): Promise<void> {
    if (undefined === modelProps.id || !Id64.isValidId64(modelProps.id))
      throw new IVaultError(
        IVaultStatus.InvalidId,
        "Model Id not provided, should be the same as the ModeledElementId"
      );

    if (this.doNotUpdateElement(modelProps.id)) {
      Logger.logInfo(
        loggerCategory,
        `Do not update target model ${modelProps.id}`
      );
      return;
    }
    try {
      const model = this.targetDb.models.getModel(modelProps.id); // throws IVaultError.NotFound if model does not exist
      if (hasEntityChanged(model, modelProps, this._modelPropertiesToIgnore)) {
        await this.onUpdateModel(modelProps);
      }
    } catch (error) {
      // catch NotFound error and insertModel
      if (
        error instanceof IVaultError &&
        error.errorNumber === IVaultStatus.NotFound
      ) {
        await this.onInsertModel(modelProps);
        return;
      }
      throw error;
    }
  }

  /** Create a new Model from the specified ModelProps and insert it into the target iVault.
   * @note A subclass may override this method to customize insert behavior but should call `super.onInsertModel`.
   */
  protected async onInsertModel(modelProps: ModelProps): Promise<Id64String> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const modelId: Id64String = this.targetDb.models.insertModel(modelProps);
      Logger.logInfo(
        loggerCategory,
        `Inserted ${this.formatModelForLogger(modelProps)}`
      );
      await this.trackProgress();
      return modelId;
    } catch (error) {
      if (!this.targetDb.containsClass(modelProps.classFullName)) {
        // replace standard insert error with something more helpful
        const errorMessage = `Model class "${modelProps.classFullName}" not found in the target iVault. Was the latest version of the schema imported?`;
        throw new IVaultError(IVaultStatus.InvalidName, errorMessage);
      }
      throw error; // throw original error
    }
  }

  /** Update an existing Model in the target iVault from the specified ModelProps.
   * @note A subclass may override this method to customize update behavior but should call `super.onUpdateModel`.
   */
  protected async onUpdateModel(modelProps: ModelProps): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.targetDb.models.updateModel(modelProps);
    Logger.logInfo(
      loggerCategory,
      `Updated ${this.formatModelForLogger(modelProps)}`
    );
    await this.trackProgress();
  }

  /** Format a Model for the Logger. */
  private formatModelForLogger(modelProps: ModelProps): string {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return `${modelProps.classFullName} [${modelProps.id!}]`;
  }

  /**
   * Tries to update an element with the specified element properties.
   * If a duplicate code error occurs, it assigns a new unique code value and retries the update
   */
  private async tryUpdateElement(elemProps: ElementProps) {
    try {
      await this.onUpdateElement(elemProps);
    } catch (err) {
      if ((err as IVaultError).errorNumber === IVaultStatus.DuplicateCode) {
        assert(
          elemProps.code.value !== undefined,
          "NULL code values are always considered unique and cannot clash"
        );
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this._duplicateCodeValueMap.set(elemProps.id!, elemProps.code.value);
        // Using NULL code values as an alternative is not valid because definition elements cannot have NULL code values.
        elemProps.code.value = Guid.createValue();
        await this.onUpdateElement(elemProps);
      } else {
        throw err;
      }
    }
  }

  /** Import the specified ElementProps (either as an insert or an update) into the target iVault. */
  public async importElement(elementProps: ElementProps): Promise<Id64String> {
    if (
      undefined !== elementProps.id &&
      this.doNotUpdateElement(elementProps.id)
    ) {
      Logger.logInfo(
        loggerCategory,
        `Do not update target element ${elementProps.id}`
      );
      return elementProps.id;
    }

    if (this.options.preserveElementIdsForFiltering) {
      if (elementProps.id === undefined) {
        throw new IVaultError(
          IVaultStatus.BadElement,
          "elementProps.id must be defined during a preserveIds operation"
        );
      }

      // Categories are the only element that onInserted will immediately insert a new element (their default subcategory)
      // since default subcategories always exist and always will be inserted after their categories, we treat them as an update
      // to prevent duplicate inserts.
      // Always present elements (0xe, 0x1, 0x10) also will be updated to prevent duplicate inserts.
      if (
        (isSubCategory(elementProps) && isDefaultSubCategory(elementProps)) ||
        this._rootElementIds.has(elementProps.id)
      ) {
        await this.onUpdateElement(elementProps);
      } else {
        if (this._elementsToUpdateDuringPreserveIds.has(elementProps.id)) {
          await this.tryUpdateElement(elementProps);
          this._elementsToUpdateDuringPreserveIds.delete(elementProps.id);
        } else {
          await this.onInsertElement(elementProps);
        }
      }
    } else {
      if (undefined !== elementProps.id) {
        await this.tryUpdateElement(elementProps);
      } else {
        elementProps.id = await this.onInsertElement(elementProps); // targetElementProps.id assigned by insertElement
      }
    }
    return elementProps.id;
  }

  /** Create a new Element from the specified ElementProps and insert it into the target iVault.
   * @returns The Id of the newly inserted Element.
   * @note A subclass may override this method to customize insert behavior but should call `super.onInsertElement`.
   */
  protected async onInsertElement(
    elementProps: ElementProps
  ): Promise<Id64String> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const elementId = this.targetDb.elements.insertElement(elementProps, {
        forceUseId: this.options.preserveElementIdsForFiltering,
      });
      // set the id like [IVaultDb.insertElement]($backend), does, the raw nativeDb method does not
      elementProps.id = elementId;
      Logger.logInfo(
        loggerCategory,
        `Inserted ${this.formatElementForLogger(elementProps)}`
      );
      await this.trackProgress();
      if (this.options.simplifyElementGeometry) {
        this.targetDb.simplifyElementGeometry({
          id: elementId,
          convertBReps: true,
        });
        Logger.logInfo(
          loggerCategory,
          `Simplified element geometry for ${this.formatElementForLogger(
            elementProps
          )}`
        );
      }
      return elementId;
    } catch (error) {
      if (!this.targetDb.containsClass(elementProps.classFullName)) {
        // replace standard insert error with something more helpful
        const errorMessage = `Element class "${elementProps.classFullName}" not found in the target iVault. Was the latest version of the schema imported?`;
        throw new IVaultError(IVaultStatus.InvalidName, errorMessage);
      }
      throw error; // throw original error
    }
  }

  /** Update an existing Element in the target iVault from the specified ElementProps.
   * @note A subclass may override this method to customize update behavior but should call `super.onUpdateElement`.
   */
  protected async onUpdateElement(elementProps: ElementProps): Promise<void> {
    if (!elementProps.id) {
      throw new IVaultError(IVaultStatus.InvalidId, "ElementId not provided");
    }
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.targetDb.elements.updateElement(elementProps);
    Logger.logInfo(
      loggerCategory,
      `Updated ${this.formatElementForLogger(elementProps)}`
    );
    await this.trackProgress();
    if (this.options.simplifyElementGeometry) {
      this.targetDb.simplifyElementGeometry({
        id: elementProps.id,
        convertBReps: true,
      });
      Logger.logInfo(
        loggerCategory,
        `Simplified element geometry for ${this.formatElementForLogger(
          elementProps
        )}`
      );
    }
  }

  /** Delete the specified Element (and all its children) from the target iVault.
   * Will delete special elements like definition elements and subjects.
   * @note A subclass may override this method to customize delete behavior but should call `super.onDeleteElement`.
   */
  protected async onDeleteElement(elementId: Id64String): Promise<void> {
    deleteElementTreeCascade(this.targetDb, elementId);
    Logger.logInfo(
      loggerCategory,
      `Deleted element ${elementId} and its descendants`
    );
    await this.trackProgress();
  }

  /** Delete the specified Element from the target iVault. */
  public async deleteElement(elementId: Id64String): Promise<void> {
    if (this.doNotUpdateElement(elementId)) {
      Logger.logInfo(
        loggerCategory,
        `Do not delete target element ${elementId}`
      );
      return;
    }
    await this.onDeleteElement(elementId);
  }

  /** Delete the specified Model from the target iVault.
   * @note A subclass may override this method to customize delete behavior but should call `super.onDeleteModel`.
   */
  protected async onDeleteModel(modelId: Id64String): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.targetDb.models.deleteModel(modelId);
    Logger.logInfo(loggerCategory, `Deleted model ${modelId}`);
    await this.trackProgress();
  }

  /** Delete the specified Model from the target iVault. */
  public async deleteModel(modelId: Id64String): Promise<void> {
    await this.onDeleteModel(modelId);
  }

  /** Format an Element for the Logger. */
  private formatElementForLogger(elementProps: ElementProps): string {
    const namePiece: string = elementProps.code.value
      ? `${elementProps.code.value} `
      : elementProps.userLabel
        ? `${elementProps.userLabel} `
        : "";
    return `${elementProps.classFullName} ${namePiece}[${elementProps.id}]`;
  }

  /** Import an ElementUniqueAspect into the target iVault. */
  public async importElementUniqueAspect(
    aspectProps: ElementAspectProps
  ): Promise<Id64String> {
    const aspects: ElementAspect[] = this.targetDb.elements.getAspects(
      aspectProps.element.id,
      aspectProps.classFullName
    );
    if (aspects.length === 0) {
      return this.onInsertElementAspect(aspectProps);
    } else if (hasEntityChanged(aspects[0], aspectProps)) {
      aspectProps.id = aspects[0].id;
      await this.onUpdateElementAspect(aspectProps);
    }
    return aspects[0].id;
  }

  /** Import the collection of ElementMultiAspects into the target iVault.
   * @param aspectPropsArray The ElementMultiAspects to import
   * @param filterFunc Optional filter func that is used to exclude target ElementMultiAspects that were added during iVault transformation from the update detection logic.
   * @note For insert vs. update reasons, it is important to process all ElementMultiAspects owned by an Element at once since we don't have aspect-specific provenance.
   * @returns the array of ids of the resulting ElementMultiAspects, in the same order of the aspectPropsArray parameter
   */
  public async importElementMultiAspects(
    aspectPropsArray: ElementAspectProps[],
    /** caller must use this to enforce any aspects added by IVaultTransformer are not considered for update */
    filterFunc: (a: ElementMultiAspect) => boolean = () => true
  ): Promise<Id64String[]> {
    const result = new Array<Id64String | undefined>(
      aspectPropsArray.length
    ).fill(undefined);

    if (aspectPropsArray.length === 0) {
      return result as Id64String[];
    }

    const elementId: Id64String = aspectPropsArray[0].element.id;
    // Determine the set of ElementMultiAspect classes to consider
    const aspectClassFullNames = new Set<string>();
    aspectPropsArray.forEach((aspectsProps: ElementAspectProps): void => {
      aspectClassFullNames.add(aspectsProps.classFullName);
    });

    // Handle ElementMultiAspects in groups by class
    for (const aspectClassFullName of aspectClassFullNames) {
      const proposedAspects = aspectPropsArray
        .map((props, index) => ({ props, index }))
        .filter(({ props }) => aspectClassFullName === props.classFullName);

      const currentAspects = this.targetDb.elements
        .getAspects(elementId, aspectClassFullName)
        .map((props, index) => ({ props, index }) as const)
        .filter(({ props }) => filterFunc(props));

      if (proposedAspects.length >= currentAspects.length) {
        for (let index = 0; index < proposedAspects.length; index++) {
          const { props, index: resultIndex } = proposedAspects[index];
          let id: Id64String;
          if (index < currentAspects.length) {
            id = currentAspects[index].props.id;
            props.id = id;
            if (hasEntityChanged(currentAspects[index].props, props)) {
              await this.onUpdateElementAspect(props);
            }
            id = props.id;
          } else {
            id = await this.onInsertElementAspect(props);
          }
          result[resultIndex] = id;
        }
      } else {
        for (let index = 0; index < currentAspects.length; index++) {
          const { props, index: resultIndex } = currentAspects[index];
          let id: Id64String;
          if (index < proposedAspects.length) {
            id = props.id;
            proposedAspects[index].props.id = id;
            if (hasEntityChanged(props, proposedAspects[index].props)) {
              await this.onUpdateElementAspect(proposedAspects[index].props);
            }
            result[resultIndex] = id;
          } else {
            await this.onDeleteElementAspect(props);
          }
        }
      }
    }

    assert(result.every((r) => typeof r !== undefined));
    return result as Id64String[];
  }

  /** Insert the ElementAspect into the target iVault.
   * @note A subclass may override this method to customize insert behavior but should call `super.onInsertElementAspect`.
   */
  protected async onInsertElementAspect(
    aspectProps: ElementAspectProps
  ): Promise<Id64String> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const id = this.targetDb.elements.insertAspect(aspectProps);
      Logger.logInfo(
        loggerCategory,
        `Inserted ${this.formatElementAspectForLogger(aspectProps)}`
      );
      await this.trackProgress();
      return id;
    } catch (error) {
      if (!this.targetDb.containsClass(aspectProps.classFullName)) {
        // replace standard insert error with something more helpful
        const errorMessage = `ElementAspect class "${aspectProps.classFullName}" not found in the target iVault. Was the latest version of the schema imported?`;
        throw new IVaultError(IVaultStatus.InvalidName, errorMessage);
      }
      throw error; // throw original error
    }
  }

  /** Update the ElementAspect within the target iVault.
   * @note A subclass may override this method to customize update behavior but should call `super.onUpdateElementAspect`.
   */
  protected async onUpdateElementAspect(
    aspectProps: ElementAspectProps
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.targetDb.elements.updateAspect(aspectProps);
    Logger.logInfo(
      loggerCategory,
      `Updated ${this.formatElementAspectForLogger(aspectProps)}`
    );
    await this.trackProgress();
  }

  /** Delete the specified ElementAspect from the target iVault.
   * @note A subclass may override this method to customize delete behavior but should call `super.onDeleteElementAspect`.
   */
  protected async onDeleteElementAspect(
    targetElementAspect: ElementAspect
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.targetDb.elements.deleteAspect(targetElementAspect.id);
    Logger.logInfo(
      loggerCategory,
      `Deleted ${this.formatElementAspectForLogger(targetElementAspect)}`
    );
    await this.trackProgress();
  }

  /** Format an ElementAspect for the Logger. */
  private formatElementAspectForLogger(
    elementAspectProps: ElementAspectProps | ElementAspect
  ): string {
    return `${elementAspectProps.classFullName} elementId=[${elementAspectProps.element.id}]`;
  }

  /** Import the specified RelationshipProps (either as an insert or an update) into the target iVault.
   * @returns The instance Id of the inserted or updated Relationship.
   */
  public async importRelationship(
    relationshipProps: RelationshipProps
  ): Promise<Id64String> {
    if (
      undefined === relationshipProps.sourceId ||
      !Id64.isValidId64(relationshipProps.sourceId)
    ) {
      Logger.logInfo(
        loggerCategory,
        `Ignoring ${relationshipProps.classFullName} instance because of invalid RelationshipProps.sourceId`
      );
      return Id64.invalid;
    }
    if (
      undefined === relationshipProps.targetId ||
      !Id64.isValidId64(relationshipProps.targetId)
    ) {
      Logger.logInfo(
        loggerCategory,
        `Ignoring ${relationshipProps.classFullName} instance because of invalid RelationshipProps.targetId`
      );
      return Id64.invalid;
    }
    // check for an existing relationship
    const relSourceAndTarget: SourceAndTarget = {
      sourceId: relationshipProps.sourceId,
      targetId: relationshipProps.targetId,
    };
    const relationship: Relationship | undefined =
      this.targetDb.relationships.tryGetInstance(
        relationshipProps.classFullName,
        relSourceAndTarget
      );
    if (undefined !== relationship) {
      // if relationship found, update it
      relationshipProps.id = relationship.id;
      if (hasEntityChanged(relationship, relationshipProps)) {
        await this.onUpdateRelationship(relationshipProps);
      }
      return relationshipProps.id;
    } else {
      return this.onInsertRelationship(relationshipProps);
    }
  }

  /** Create a new Relationship from the specified RelationshipProps and insert it into the target iVault.
   * @returns The instance Id of the newly inserted relationship.
   * @note A subclass may override this method to customize insert behavior but should call `super.onInsertRelationship`.
   */
  protected async onInsertRelationship(
    relationshipProps: RelationshipProps
  ): Promise<Id64String> {
    try {
      const targetRelInstanceId: Id64String =
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        this.targetDb.relationships.insertInstance(relationshipProps);
      Logger.logInfo(
        loggerCategory,
        `Inserted ${this.formatRelationshipForLogger(relationshipProps)}`
      );
      await this.trackProgress();
      return targetRelInstanceId;
    } catch (error) {
      if (!this.targetDb.containsClass(relationshipProps.classFullName)) {
        // replace standard insert error with something more helpful
        const errorMessage = `Relationship class "${relationshipProps.classFullName}" not found in the target iVault. Was the latest version of the schema imported?`;
        throw new IVaultError(IVaultStatus.InvalidName, errorMessage);
      }
      throw error; // throw original error
    }
  }

  /** Update an existing Relationship in the target iVault from the specified RelationshipProps.
   * @note A subclass may override this method to customize update behavior but should call `super.onUpdateRelationship`.
   */
  protected async onUpdateRelationship(
    relationshipProps: RelationshipProps
  ): Promise<void> {
    if (!relationshipProps.id) {
      throw new IVaultError(
        IVaultStatus.InvalidId,
        "Relationship instance Id not provided"
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.targetDb.relationships.updateInstance(relationshipProps);
    Logger.logInfo(
      loggerCategory,
      `Updated ${this.formatRelationshipForLogger(relationshipProps)}`
    );
    await this.trackProgress();
  }

  /** Delete the specified Relationship from the target iVault. */
  protected async onDeleteRelationship(
    relationshipProps: RelationshipPropsForDelete
  ): Promise<void> {
    // Only passing in what deleteInstance actually uses, full relationshipProps is not necessary.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.targetDb.relationships.deleteInstance({
      id: relationshipProps.id,
      classFullName: relationshipProps.classFullName,
    } as RelationshipProps);
    Logger.logInfo(
      loggerCategory,
      `Deleted relationship ${relationshipProps.classFullName} id=${relationshipProps.id}`
    );
    await this.trackProgress();
  }

  /** Delete the specified Relationship from the target iVault. */
  public async deleteRelationship(
    relationshipProps: RelationshipPropsForDelete
  ): Promise<void> {
    await this.onDeleteRelationship(relationshipProps);
  }

  /** Format a Relationship for the Logger. */
  private formatRelationshipForLogger(relProps: RelationshipProps): string {
    return `${relProps.classFullName} sourceId=[${relProps.sourceId}] targetId=[${relProps.targetId}]`;
  }

  /** Tracks incremental progress */
  private async trackProgress(): Promise<void> {
    this._progressCounter++;
    if (0 === this._progressCounter % this.progressInterval) {
      await this.onProgress();
    }
  }

  /** This method is called when IVaultImporter has made incremental progress based on the [[progressInterval]] setting.
   * @note A subclass may override this method to report custom progress but should call `super.onProgress`.
   */
  protected async onProgress(): Promise<void> {}

  /** Optionally compute the projectExtents for the target iVault depending on the options for this IVaultImporter.
   * @note This method is automatically called from [IVaultTransformer.process]($transformer).
   * @see [IVaultDb.computeProjectExtents]($backend), [[autoExtendProjectExtents]]
   */
  public computeProjectExtents(): void {
    const computedProjectExtents = this.targetDb.computeProjectExtents({
      reportExtentsWithOutliers: true,
      reportOutliers: true,
    });
    Logger.logInfo(
      loggerCategory,
      `Current projectExtents=${JSON.stringify(this.targetDb.projectExtents)}`
    );
    Logger.logInfo(
      loggerCategory,
      `Computed projectExtents without outliers=${JSON.stringify(
        computedProjectExtents.extents
      )}`
    );
    Logger.logInfo(
      loggerCategory,
      `Computed projectExtents with outliers=${JSON.stringify(
        computedProjectExtents.extentsWithOutliers
      )}`
    );
    if (this.options.autoExtendProjectExtents) {
      const excludeOutliers: boolean =
        typeof this.options.autoExtendProjectExtents === "object"
          ? this.options.autoExtendProjectExtents.excludeOutliers
          : false;
      // If excludeOutliers is true, use the extents without outliers.
      // Otherwise prefer extentsWithOutliers, but fall back to extents if it's undefined or a null range.
      const extentsWithOutliers = computedProjectExtents.extentsWithOutliers;
      const useExtentsWithOutliers =
        !excludeOutliers && extentsWithOutliers && !extentsWithOutliers.isNull;
      const newProjectExtents = useExtentsWithOutliers
        ? extentsWithOutliers
        : computedProjectExtents.extents;
      if (!newProjectExtents.isAlmostEqual(this.targetDb.projectExtents)) {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        this.targetDb.updateProjectExtents(newProjectExtents);
        Logger.logInfo(
          loggerCategory,
          `Updated projectExtents=${JSON.stringify(
            this.targetDb.projectExtents
          )}`
        );
      }
      if (
        !excludeOutliers &&
        computedProjectExtents.outliers &&
        computedProjectExtents.outliers.length > 0
      ) {
        Logger.logInfo(
          loggerCategory,
          `${computedProjectExtents.outliers.length} outliers detected within projectExtents`
        );
      }
    } else {
      if (
        !this.targetDb.projectExtents.containsRange(
          computedProjectExtents.extents
        )
      ) {
        Logger.logWarning(
          loggerCategory,
          "Current project extents may be too small"
        );
      }
      if (
        computedProjectExtents.outliers &&
        computedProjectExtents.outliers.length > 0
      ) {
        Logger.logInfo(
          loggerCategory,
          `${computedProjectExtents.outliers.length} outliers detected within projectExtents`
        );
      }
    }
  }

  /** Examine the geometry streams of every [GeometricElement3d]($backend) in the target iVault and apply the specified optimizations.
   * @note This method is automatically called from [[IVaultTransformer.process]] if
   * [[IVaultTransformOptions.optimizeGeometry]] is defined.
   */
  public optimizeGeometry(options: OptimizeGeometryOptions): void {
    if (options.inlineUniqueGeometryParts) {
      const result = this.targetDb.inlineGeometryParts();
      Logger.logInfo(
        loggerCategory,
        `Inlined ${result.numRefsInlined} references to ${result.numCandidateParts} geometry parts and deleted ${result.numPartsDeleted} parts.`
      );
    }
  }

  private resolveDuplicateCodeValues(): void {
    for (const [elementId, codeValue] of this._duplicateCodeValueMap) {
      const element = this.targetDb.elements.getElement(elementId);
      element.code.value = codeValue;
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      element.update();
    }
    this._duplicateCodeValueMap.clear();
  }

  /**
   * Needs to be called to perform necessary cleanup operations.
   * By not calling `finalize` there is a risk that data imported into targetDb will not be as expected.
   *
   * @note No need to call this If using [[IVaultTransformer]] as it automatically invokes this method.
   */
  public finalize(): void {
    this.resolveDuplicateCodeValues();
  }
}

/** Returns true if a change within an Entity is detected.
 * @param entity The current persistent Entity.
 * @param entityProps The new EntityProps to compare against
 * @note This method should only be called if changeset information is not available.
 * @internal
 */
export function hasEntityChanged(
  entity: Entity,
  entityProps: EntityProps,
  namesToIgnore?: Set<string>
): boolean {
  let changed: boolean = false;
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  entity.forEach((propertyName: string, property: Property) => {
    if (!changed) {
      if (namesToIgnore && namesToIgnore.has(propertyName)) {
        // skip
      } else if (PropertyType.Binary === property.propertyType) {
        changed = hasBinaryValueChanged(
          entity.asAny[DMJsNames.toJsName(propertyName)],
          (entityProps as any)[DMJsNames.toJsName(propertyName)]
        );
      } else if (property.isNavigation()) {
        changed = hasNavigationValueChanged(
          entity.asAny[DMJsNames.toJsName(propertyName)],
          (entityProps as any)[DMJsNames.toJsName(propertyName)]
        );
      } else {
        changed = hasValueChanged(
          entity.asAny[DMJsNames.toJsName(propertyName)],
          (entityProps as any)[DMJsNames.toJsName(propertyName)]
        );
      }
    }
  });
  return changed;
}

/** Returns true if the specified binary values are different. */
function hasBinaryValueChanged(
  binaryProperty1: any,
  binaryProperty2: any
): boolean {
  const jsonString1 = JSON.stringify(
    binaryProperty1,
    Base64EncodedString.replacer
  );
  const jsonString2 = JSON.stringify(
    binaryProperty2,
    Base64EncodedString.replacer
  );
  return jsonString1 !== jsonString2;
}

/** Returns true if the specified navigation property values are different. */
function hasNavigationValueChanged(
  navigationProperty1: any,
  navigationProperty2: any
): boolean {
  const relatedElement1 = RelatedElement.fromJSON(navigationProperty1);
  const relatedElement2 = RelatedElement.fromJSON(navigationProperty2);
  const jsonString1 = JSON.stringify(relatedElement1);
  const jsonString2 = JSON.stringify(relatedElement2);
  return jsonString1 !== jsonString2;
}

/** Returns true if the specified navigation property values are different. */
function hasValueChanged(property1: any, property2: any): boolean {
  return JSON.stringify(property1) !== JSON.stringify(property2);
}

/** check if element props are a subcategory */
function isSubCategory(props: ElementProps): props is SubCategoryProps {
  return props.classFullName === SubCategory.classFullName;
}

/** check if element props are a subcategory without loading the element */
function isDefaultSubCategory(props: SubCategoryProps): boolean {
  if (props.id === undefined) return false;

  if (!Id64.isId64(props.id))
    throw new IVaultError(
      IVaultStatus.BadElement,
      "subcategory had invalid id"
    );
  if (props.parent?.id === undefined)
    throw new IVaultError(
      IVaultStatus.BadElement,
      `subcategory with id ${props.id} had no parent`
    );
  return props.id === IVaultDb.getDefaultSubCategoryId(props.parent.id);
}
