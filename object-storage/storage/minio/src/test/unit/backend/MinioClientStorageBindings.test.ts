/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { DIContainer } from "@szewtwin/cloud-agnostic-core";
import { ClientStorage, Types as CoreTypes } from "@szewtwin/object-storage-core";
import {
  DependencyBindingsTestCase,
  testBindings,
} from "@szewtwin/object-storage-tests-backend-unit";

import {
  MinioClientStorage,
  MinioClientStorageBindings,
} from "../../../client";

describe(`${MinioClientStorageBindings.name}`, () => {
  const clientBindings = new MinioClientStorageBindings();

  describe(`${clientBindings.register.name}()`, () => {
    const bindingsTestCases: DependencyBindingsTestCase[] = [
      {
        testedClassIdentifier: ClientStorage.name,
        testedFunction: (c: DIContainer) =>
          c.resolve<ClientStorage>(CoreTypes.Client.clientStorage),
        expectedCtor: MinioClientStorage,
      },
    ];
    testBindings(clientBindings, undefined, bindingsTestCases);
  });
});
