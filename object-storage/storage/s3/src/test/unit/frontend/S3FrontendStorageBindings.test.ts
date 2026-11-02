/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  Types as CoreTypes,
  FrontendStorage,
} from "@szewtwin/object-storage-core/lib/frontend";
import {
  DependencyBindingsTestCase,
  testBindings,
} from "@szewtwin/object-storage-tests-backend-unit/lib/shared/test-templates/BindingsTests";

import { DIContainer } from "@szewtwin/cloud-agnostic-core";

import {
  FrontendS3ClientWrapperFactory,
  S3FrontendStorage,
  S3FrontendStorageBindings,
} from "../../../frontend";

describe(`${S3FrontendStorageBindings.name}`, () => {
  const frontendBindings = new S3FrontendStorageBindings();

  describe(`${frontendBindings.register.name}()`, () => {
    const bindingsTestCases: DependencyBindingsTestCase[] = [
      {
        testedClassIdentifier:
          CoreTypes.Frontend.clientWrapperFactory.toString(),
        testedFunction: (c: DIContainer) =>
          c.resolve<FrontendS3ClientWrapperFactory>(
            CoreTypes.Frontend.clientWrapperFactory
          ),
        expectedCtor: FrontendS3ClientWrapperFactory,
      },
      {
        testedClassIdentifier: FrontendStorage.name,
        testedFunction: (c: DIContainer) =>
          c.resolve<FrontendStorage>(CoreTypes.Frontend.frontendStorage),
        expectedCtor: S3FrontendStorage,
      },
    ];
    testBindings(frontendBindings, undefined, bindingsTestCases);
  });
});
