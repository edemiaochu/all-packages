/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  TestIVaultGroupFactory,
  cleanupDirectory,
  createDirectory,
  createGuidValue,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants } from "./Constants";
import { getTestDIContainer } from "./TestDiContainerProvider";

let testRunId: string;
export function getTestRunId(): string {
  if (!testRunId) testRunId = createGuidValue();
  return testRunId;
}

before(async () => {
  await cleanupTestRuniVaults();
  createDirectory(Constants.TestDownloadDirectoryPath);
  await cleanupDirectory(Constants.TestDownloadDirectoryPath);
});

after(async () => {
  await cleanupTestRuniVaults();
  await cleanupDirectory(Constants.TestDownloadDirectoryPath);
});

async function cleanupTestRuniVaults(): Promise<void> {
  const container = getTestDIContainer();
  const testIVaultGroupFactory = container.get(TestIVaultGroupFactory);
  const testIVaultGroup = testIVaultGroupFactory.create({
    testRunId: getTestRunId(),
    packageName: Constants.PackagePrefix,
  });
  await testIVaultGroup.cleanupIVaults();
}
