/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, it, vi } from "vitest";
import { PropertyDescription } from "@szewtwin/appui-abstract";
import { PropertyValueRendererManager } from "@szewtwin/components-react";
import { EmptyLocalization } from "@szewtwin/core-common";
import { IVaultApp, IVaultConnection } from "@szewtwin/core-frontend";
import { Content, KeySet, LabelDefinition, NavigationPropertyInfo } from "@szewtwin/presentation-common";
import { Presentation, PresentationManager } from "@szewtwin/presentation-frontend";
import { IContentDataProvider } from "../../../presentation-components/common/ContentDataProvider.js";
import { NavigationPropertyTargetEditor } from "../../../presentation-components/properties/editors/NavigationPropertyEditor.js";
import {
  NavigationPropertyEditorContextProvider,
  NavigationPropertyEditorContextProviderProps,
  useNavigationPropertyEditorContextProviderProps,
} from "../../../presentation-components/properties/editors/NavigationPropertyEditorContext.js";
import { stubVirtualization } from "../../_helpers/Common.js";
import {
  createTestContentDescriptor,
  createTestContentItem,
  createTestPropertiesContentField,
  createTestSimpleContentField,
} from "../../_helpers/Content.js";
import { createTestPropertyRecord } from "../../_helpers/UiComponents.js";
import { renderHook, render as renderRTL, waitFor } from "../../TestUtils.js";

function createNavigationPropertyInfo(): NavigationPropertyInfo {
  return {
    classInfo: { name: "TestSchema:PropClass", label: "Prop Class", id: "1" },
    targetClassInfo: { name: "TestSchema:TargetClass", label: "Target Class", id: "2" },
    isForwardRelationship: true,
    isTargetPolymorphic: true,
  };
}

function render(ui: React.ReactElement, context?: Partial<NavigationPropertyEditorContextProviderProps>) {
  const props: NavigationPropertyEditorContextProviderProps = {
    getNavigationPropertyInfo: context?.getNavigationPropertyInfo ?? (async () => createNavigationPropertyInfo()),
    ivault: context?.ivault ?? ({} as IVaultConnection),
  };
  return renderRTL(<NavigationPropertyEditorContextProvider {...props}>{ui}</NavigationPropertyEditorContextProvider>);
}

describe("<NavigationPropertyTargetEditor />", () => {
  const getContentStub = vi.fn<PresentationManager["getContent"]>();
  const testRecord = createTestPropertyRecord();

  stubVirtualization();
  beforeEach(() => {
    const localization = new EmptyLocalization();
    vi.spyOn(IVaultApp, "initialized", "get").mockReturnValue(true);
    vi.spyOn(IVaultApp, "localization", "get").mockReturnValue(localization);
    vi.spyOn(Presentation, "localization", "get").mockReturnValue(localization);
    vi.spyOn(Presentation, "presentation", "get").mockReturnValue({
      getContent: getContentStub,
    } as unknown as PresentationManager);

    getContentStub.mockReset();
    getContentStub.mockResolvedValue(undefined);
  });

  it("renders selector when rendered inside context", async () => {
    const { queryByRole } = render(<NavigationPropertyTargetEditor propertyRecord={testRecord} />, {});
    await waitFor(() => expect(queryByRole("combobox")).not.toBeNull());
  });

  it("uses default property renderer when rendered not in the context", () => {
    const rendererStub = vi.spyOn(PropertyValueRendererManager.defaultManager, "render");
    renderRTL(<NavigationPropertyTargetEditor propertyRecord={testRecord} />);
    expect(rendererStub).toHaveBeenCalledWith(testRecord);
  });

  it("renders nothing when property record is 'undefined'", () => {
    const { container } = render(<NavigationPropertyTargetEditor />, {});
    expect(container.firstChild).toBeNull();
  });

  it("invokes 'onCommit' when new target is selected changes", async () => {
    const contentItem = createTestContentItem({
      label: LabelDefinition.fromLabelString("TestLabel"),
      primaryKeys: [{ id: "1", className: "TestSchema:TestClass" }],
      values: {},
      displayValues: {},
    });
    getContentStub.mockResolvedValue(
      new Content(createTestContentDescriptor({ fields: [], categories: [] }), [contentItem]),
    );
    const spy = vi.fn();
    const { getByPlaceholderText, getByText, getByDisplayValue, user } = render(
      <NavigationPropertyTargetEditor propertyRecord={testRecord} onCancel={() => {}} onCommit={spy} />,
      {
        getNavigationPropertyInfo: async () => ({
          classInfo: { id: "1", label: "Class Label", name: "TestSchema:TestClass" },
          targetClassInfo: { id: "1", label: "Target Label", name: "TestSchema:TargetClass" },
          isForwardRelationship: true,
          isTargetPolymorphic: true,
        }),
      },
    );

    // open dropdown
    const select = await waitFor(() => getByPlaceholderText("navigation-property-editor.select-target-instance"));
    await user.click(select);

    // select option from dropdown
    const target = await waitFor(() => getByText(contentItem.label.displayValue));
    await user.click(target);

    await waitFor(() => getByDisplayValue(contentItem.label.displayValue));
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe("useNavigationPropertyEditorContextProviderProps", () => {
  interface Props {
    ivault: IVaultConnection;
    dataProvider: IContentDataProvider;
  }
  const testIvault = {} as IVaultConnection;
  let testDataProvider: IContentDataProvider;

  beforeEach(() => {
    testDataProvider = {
      ivault: testIvault,
      rulesetId: "",
      displayType: "",
      [Symbol.dispose]: () => {},
      dispose: () => {},
      getContent: async () => undefined,
      getContentDescriptor: async () => undefined,
      getContentSetSize: async () => 0,
      getFieldByPropertyRecord: async () => undefined,
      getFieldByPropertyDescription: async () => undefined,
      keys: new KeySet(),
      selectionInfo: undefined,
    };
  });

  it("returns navigation property info", async () => {
    const propertyDescription: PropertyDescription = {
      displayLabel: "TestProp",
      name: "test_prop",
      typename: "navigation",
    };
    const navigationPropertyInfo: NavigationPropertyInfo = {
      classInfo: { id: "1", label: "Class Label", name: "TestSchema:TestClass" },
      targetClassInfo: { id: "2", label: "Target Label", name: "TestSchema:TargetClass" },
      isForwardRelationship: true,
      isTargetPolymorphic: true,
    };

    testDataProvider.getFieldByPropertyDescription = async () =>
      createTestPropertiesContentField({
        properties: [
          {
            property: {
              classInfo: { id: "3", label: "Field Class", name: "TestSchema:FieldClass" },
              name: "Field Name",
              type: "navigation",
              navigationPropertyInfo,
            },
          },
        ],
      });

    const { result } = renderHook(
      ({ ivault, dataProvider }: Props) => useNavigationPropertyEditorContextProviderProps(ivault, dataProvider),
      { initialProps: { ivault: testIvault, dataProvider: testDataProvider } },
    );

    const info = await result.current.getNavigationPropertyInfo(propertyDescription);
    expect(info).toBe(navigationPropertyInfo);
  });

  it("returns undefined if non properties field is returned", async () => {
    const propertyDescription: PropertyDescription = {
      displayLabel: "TestProp",
      name: "test_prop",
      typename: "navigation",
    };
    testDataProvider.getFieldByPropertyDescription = async () => createTestSimpleContentField();

    const { result } = renderHook(
      ({ ivault, dataProvider }: Props) => useNavigationPropertyEditorContextProviderProps(ivault, dataProvider),
      { initialProps: { ivault: testIvault, dataProvider: testDataProvider } },
    );

    const info = await result.current.getNavigationPropertyInfo(propertyDescription);
    expect(info).toBeUndefined();
  });
});
