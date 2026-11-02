/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  FrontendStorage,
  Types as CoreTypes,
} from "@szewtwin/object-storage-core/lib/frontend";
import {
  DependencyBindingsTestCase,
  testBindings,
} from "@szewtwin/object-storage-tests-backend-unit/lib/shared/test-templates/BindingsTests";

import { DIContainer } from "@szewtwin/cloud-agnostic-core";

import {
  AzureFrontendStorage,
  AzureFrontendStorageBindings,
  FrontendBlockBlobClientWrapperFactory,
} from "../../../frontend";

describe(`${AzureFrontendStorageBindings.name}`, () => {
  const frontendBindings = new AzureFrontendStorageBindings();

  describe(`${frontendBindings.register.name}()`, () => {
    const bindingsTestCases: DependencyBindingsTestCase[] = [
      {
        testedClassIdentifier: FrontendStorage.name,
        testedFunction: (c: DIContainer) =>
          c.resolve<FrontendStorage>(CoreTypes.Frontend.frontendStorage),
        expectedCtor: AzureFrontendStorage,
      },
      {
        testedClassIdentifier:
          CoreTypes.Frontend.clientWrapperFactory.toString(),
        testedFunction: (c: DIContainer) =>
          c.resolve<FrontendBlockBlobClientWrapperFactory>(
            CoreTypes.Frontend.clientWrapperFactory
          ),
        expectedCtor: FrontendBlockBlobClientWrapperFactory,
      },
    ];
    testBindings(frontendBindings, undefined, bindingsTestCases);
  });
});
