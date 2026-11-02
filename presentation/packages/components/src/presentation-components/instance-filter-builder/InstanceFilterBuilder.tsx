/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module InstancesFilter
 */

import "./InstanceFilterBuilder.scss";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BehaviorSubject, from, of } from "rxjs";
import { map } from "rxjs/internal/operators/map";
import { switchAll } from "rxjs/internal/operators/switchAll";
import { PropertyDescription } from "@szewtwin/appui-abstract";
import {
  PropertyFilterBuilderRenderer,
  PropertyFilterBuilderRendererProps,
  PropertyFilterBuilderRuleValueRendererProps,
} from "@szewtwin/components-react";
import { IVaultConnection } from "@szewtwin/core-frontend";
import { Alert, ComboBox, SelectOption } from "@szewtwin/szewtwinui-react";
import { ClassInfo, Descriptor, Keys } from "@szewtwin/presentation-common";
import { translate } from "../common/Utils.js";
import { getIVaultMetadataProvider } from "./DMMetadataProvider.js";
import {
  PresentationFilterBuilderValueRenderer,
  PresentationInstanceFilterPropertyInfo,
  useInstanceFilterPropertyInfos,
} from "./PresentationFilterBuilder.js";
import { isFilterNonEmpty } from "./Utils.js";

/**
 * Props for [[InstanceFilterBuilder]] component.
 * @internal
 */
export interface InstanceFilterBuilderProps extends PropertyFilterBuilderRendererProps {
  /** Currently selected classes. */
  selectedClasses: ClassInfo[];
  /** List of all available classes. */
  classes: ClassInfo[];
  /** Callback that is invoked when selected classes changes. */
  onSelectedClassesChanged: (classIds: string[]) => void;
  /** iVault connection that will be used for getting [[navigationPropertyEditorContext]] */
  ivault: IVaultConnection;
  /** [Descriptor]($presentation-common) that will be used for getting [[navigationPropertyEditorContext]]. */
  descriptor: Descriptor;
  /** [Keys]($presentation-common) that will be passed through to [[FilterBuilderValueRenderer]] */
  descriptorInputKeys?: Keys;
}

/**
 * Component for building complex instance filters based on instance properties. In addition to filter builder component
 * it renders selector for classes that can be used to filter out available properties in filter rules.
 * @internal
 */
export function InstanceFilterBuilder(props: InstanceFilterBuilderProps) {
  const { selectedClasses, classes, onSelectedClassesChanged, ivault, descriptor, descriptorInputKeys, ...restProps } =
    props;

  const [showClassSelectionWarning, setShowClassSelectionWarning] = useState(false);
  const options = useMemo(() => classes.map(createOption), [classes]);
  const selectedOptions = useMemo(() => selectedClasses.map((classInfo) => classInfo.id), [selectedClasses]);

  return (
    <>
      {showClassSelectionWarning && (
        <Alert type="warning" className="class-selection-warning">
          {translate("instance-filter-builder.class-selection-warning")}
        </Alert>
      )}
      <div className="presentation-instance-filter">
        <ComboBox
          enableVirtualization={true}
          multiple={true}
          options={options}
          value={selectedOptions}
          inputProps={{
            placeholder: selectedClasses.length
              ? translate("instance-filter-builder.selected-classes")
              : translate("instance-filter-builder.select-classes-optional"),
          }}
          onShow={() => setShowClassSelectionWarning(!!selectedOptions.length && isFilterNonEmpty(props.rootGroup))}
          onHide={() => setShowClassSelectionWarning(false)}
          onChange={(selectedIds) => {
            onSelectedClassesChanged(selectedIds);
          }}
        />
        <div className="presentation-property-filter-builder">
          <PropertyFilterBuilderRenderer
            {...restProps}
            ruleValueRenderer={(rendererProps: PropertyFilterBuilderRuleValueRendererProps) => (
              <PresentationFilterBuilderValueRenderer
                {...rendererProps}
                descriptorInputKeys={descriptorInputKeys}
                ivault={ivault}
                descriptor={descriptor}
                selectedClasses={selectedClasses}
              />
            )}
          />
        </div>
      </div>
    </>
  );
}

function createOption(classInfo: ClassInfo): SelectOption<string> {
  return { label: classInfo.label, value: classInfo.id };
}

/**
 * Custom hook that extracts properties and classes from [Descriptor]($presentation-common) and creates props that can be used by [[InstanceFilterBuilder]] component.
 *
 * This hook also makes sure that when classes are selected available properties list is updated to contain only properties found on selected classes and vice versa -
 * when property is selected in one of the rules selected classes list is updated to contain only classes that has access to that property.
 * @internal
 */
export function usePresentationInstanceFilteringProps(
  descriptor: Descriptor,
  ivault: IVaultConnection,
  initialActiveClasses?: ClassInfo[],
): Required<
  Pick<
    InstanceFilterBuilderProps,
    | "properties"
    | "classes"
    | "selectedClasses"
    | "onSelectedClassesChanged"
    | "propertyRenderer"
    | "onRulePropertySelected"
    | "isDisabled"
  >
> {
  const { propertyInfos, propertyRenderer } = useInstanceFilterPropertyInfos({ descriptor });
  const classes = usePropertyClasses({ descriptor });
  const { activeClasses, changeActiveClasses, isFilteringClasses, filterClassesByProperty } = useActiveClasses({
    ivault,
    availableClasses: classes,
    initialActiveClasses,
  });
  const { properties, isFilteringProperties } = usePropertiesFilteringByClass({
    ivault,
    availableProperties: propertyInfos,
    activeClasses,
  });

  const onRulePropertySelected = useCallback(
    (property: PropertyDescription) => {
      const propertyInfo = propertyInfos.find((info) => info.propertyDescription.name === property.name);
      if (propertyInfo) {
        filterClassesByProperty(propertyInfo);
      }
    },
    [propertyInfos, filterClassesByProperty],
  );

  return {
    onRulePropertySelected,
    onSelectedClassesChanged: useCallback((classIds) => changeActiveClasses(classIds), [changeActiveClasses]),
    propertyRenderer,
    properties,
    classes,
    selectedClasses: activeClasses,
    isDisabled: isFilteringClasses || isFilteringProperties,
  };
}
interface UsePropertyClassesProps {
  descriptor: Descriptor;
}

function usePropertyClasses({ descriptor }: UsePropertyClassesProps) {
  return useMemo((): ClassInfo[] => {
    const uniqueClasses = new Map();
    descriptor.selectClasses.forEach((selectClass) =>
      uniqueClasses.set(selectClass.selectClassInfo.id, selectClass.selectClassInfo),
    );
    return [...uniqueClasses.values()];
  }, [descriptor]);
}

interface UsePropertiesFilteringByClassProps {
  ivault: IVaultConnection;
  availableProperties: PresentationInstanceFilterPropertyInfo[];
  activeClasses: ClassInfo[];
}

function usePropertiesFilteringByClass({
  ivault,
  availableProperties,
  activeClasses,
}: UsePropertiesFilteringByClassProps) {
  const [filteredProperties, setFilteredProperties] = useState<PresentationInstanceFilterPropertyInfo[] | undefined>();
  const [isFilteringProperties, setIsFilteringProperties] = useState(false);
  const properties = useMemo(
    () => (filteredProperties ?? availableProperties).map((info) => info.propertyDescription),
    [availableProperties, filteredProperties],
  );

  const classChanges = useRef(new BehaviorSubject<ClassInfo[]>([]));
  useEffect(() => {
    classChanges.current.next(activeClasses);
  }, [activeClasses]);

  // filter properties by selected classes
  useEffect(() => {
    const subscription = classChanges.current
      .pipe(
        map((classes) => {
          if (classes.length === 0) {
            return of(undefined);
          }
          setIsFilteringProperties(true);
          return from(computePropertiesByClasses(availableProperties, classes, ivault));
        }),
        switchAll(),
      )
      .subscribe({
        next: (infos: PresentationInstanceFilterPropertyInfo[] | undefined) => {
          setFilteredProperties(infos);
          setIsFilteringProperties(false);
        },
      });
    return () => {
      subscription.unsubscribe();
    };
  }, [ivault, availableProperties]);

  return { properties, isFilteringProperties };
}

interface UseActiveClassesProps {
  ivault: IVaultConnection;
  availableClasses: ClassInfo[];
  initialActiveClasses?: ClassInfo[];
}

function useActiveClasses({ ivault, availableClasses, initialActiveClasses }: UseActiveClassesProps) {
  const [activeClasses, setActiveClasses] = useState<ClassInfo[]>(initialActiveClasses ?? []);
  const [isFilteringClasses, setIsFilteringClasses] = useState(false);

  const availableClassesRef = useRef(availableClasses);
  useEffect(() => {
    if (availableClassesRef.current !== availableClasses) {
      setActiveClasses([]);
      availableClassesRef.current = availableClasses;
    }
  }, [availableClasses]);

  const filterClassesByProperty = useCallback(
    (property: PresentationInstanceFilterPropertyInfo) => {
      setIsFilteringClasses(true);
      void (async () => {
        const newActiveClasses = await computeClassesByProperty(
          activeClasses.length === 0 ? availableClasses : activeClasses,
          property,
          ivault,
        );
        setActiveClasses(newActiveClasses);
        setIsFilteringClasses(false);
      })();
    },
    [activeClasses, availableClasses, ivault],
  );

  const changeActiveClasses = useCallback(
    (classIds: string[]) => {
      const newSelectedClasses = availableClasses.filter(
        (availableClass) => classIds.findIndex((classId) => classId === availableClass.id) !== -1,
      );
      setActiveClasses(newSelectedClasses);
    },
    [availableClasses],
  );

  return { activeClasses, isFilteringClasses, changeActiveClasses, filterClassesByProperty };
}

async function computePropertiesByClasses(
  properties: PresentationInstanceFilterPropertyInfo[],
  classes: ClassInfo[],
  ivault: IVaultConnection,
): Promise<PresentationInstanceFilterPropertyInfo[] | undefined> {
  const metadataProvider = getIVaultMetadataProvider(ivault);
  const dmClassInfos = await Promise.all(classes.map(async (info) => metadataProvider.getDMClassInfo(info.id)));
  const filteredProperties: PresentationInstanceFilterPropertyInfo[] = [];
  for (const prop of properties) {
    // property should be shown if at least one of selected classes is derived from property source class
    if (
      dmClassInfos.some(
        (info) => info && prop.sourceClassIds.some((sourceClassId) => info.isDerivedFrom(sourceClassId)),
      )
    ) {
      filteredProperties.push(prop);
    }
  }

  return filteredProperties.length === properties.length ? undefined : filteredProperties;
}

async function computeClassesByProperty(
  classes: ClassInfo[],
  property: PresentationInstanceFilterPropertyInfo,
  ivault: IVaultConnection,
): Promise<ClassInfo[]> {
  const metadataProvider = getIVaultMetadataProvider(ivault);

  const propertyClasses = (
    await Promise.all(
      property.sourceClassIds.map(async (sourceClassId) => {
        return metadataProvider.getDMClassInfo(sourceClassId);
      }),
    )
  ).filter((propertyClass) => propertyClass !== undefined);

  /* v8 ignore next 3 -- @preserve */
  if (propertyClasses.length === 0) {
    return classes;
  }

  const classesWithProperty: ClassInfo[] = [];
  for (const currentClass of classes) {
    if (propertyClasses.some((propertyClass) => propertyClass.isBaseOf(currentClass.id))) {
      classesWithProperty.push(currentClass);
    }
  }

  return classesWithProperty;
}
