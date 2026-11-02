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

import { S3ClientStorage, S3ClientStorageBindings } from "../../../client";
import { S3ClientWrapperFactory } from "../../../server";

describe(`${S3ClientStorageBindings.name}`, () => {
  const clientBindings = new S3ClientStorageBindings();

  describe(`${clientBindings.register.name}()`, () => {
    const bindingsTestCases: DependencyBindingsTestCase[] = [
      {
        testedClassIdentifier: CoreTypes.Client.clientWrapperFactory.toString(),
        testedFunction: (c: DIContainer) =>
          c.resolve<S3ClientWrapperFactory>(
            CoreTypes.Client.clientWrapperFactory
          ),
        expectedCtor: S3ClientWrapperFactory,
      },
      {
        testedClassIdentifier: ClientStorage.name,
        testedFunction: (c: DIContainer) =>
          c.resolve<ClientStorage>(CoreTypes.Client.clientStorage),
        expectedCtor: S3ClientStorage,
      },
    ];
    testBindings(clientBindings, undefined, bindingsTestCases);
  });
});
