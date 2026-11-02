/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { randomUUID } from "crypto";

import {
  CreateIVaultFromBaselineParams,
  IVaultsClient,
  IVaultsClientOptions,
} from "@szewtwin/ivaults-client-authoring";
import {
  AuthorizationCallback,
  ContainerTypes,
  IVault,
} from "@szewtwin/ivaults-client-management";
import {
  TestAuthorizationProvider,
  TestIVaultFileProvider,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestSZEWTwinProvider,
  TestUtilTypes,
  assertIVault,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Authoring] IVaultOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;
  let szewTwinId: string;

  let testIVaultFileProvider: TestIVaultFileProvider;
  let testIVaultGroup: TestIVaultGroup;

  before(async () => {
    const container = getTestDIContainer();

    const iVaultsClientOptions = container.get<IVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    iVaultsClient = new IVaultsClient(iVaultsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const testSZEWTwinProvider = container.get(TestSZEWTwinProvider);
    szewTwinId = await testSZEWTwinProvider.getOrCreate();

    testIVaultFileProvider = container.get(TestIVaultFileProvider);

    const testIVaultGroupFactory = container.get(TestIVaultGroupFactory);
    testIVaultGroup = testIVaultGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "AuthoringIVaultOperations",
    });
  });

  after(async () => {
    await testIVaultGroup.cleanupIVaults();
  });

  it("should create an iVault from baseline", async () => {
    // Arrange
    const createIVaultParams: CreateIVaultFromBaselineParams = {
      authorization,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getPrefixedUniqueIVaultName(
          "Sample iVault from baseline"
        ),
        filePath: testIVaultFileProvider.iVault.filePath,
        containersEnabled: ContainerTypes.None,
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVault: IVault = await iVaultsClient.iVaults.createFromBaseline(
      createIVaultParams
    );

    // Assert
    await assertIVault({
      actualIVault: iVault,
      expectedIVaultProperties: createIVaultParams.iVaultProperties,
    });
  });

  it("should create an iVault from baseline with GCS", async () => {
    // Arrange
    const createIVaultParams: CreateIVaultFromBaselineParams = {
      authorization,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getPrefixedUniqueIVaultName(
          "Sample iVault from baseline with horizontal CRS"
        ),
        filePath: testIVaultFileProvider.iVault.filePath,
        containersEnabled: ContainerTypes.None,
        geographicCoordinateSystem: {
          horizontalCRSId: "EPSG:3857",
        },
      },
      headers: {
        "X-Correlation-Id": randomUUID(),
      },
    };

    // Act
    const iVault: IVault = await iVaultsClient.iVaults.createFromBaseline(
      createIVaultParams
    );

    // Assert
    await assertIVault({
      actualIVault: iVault,
      expectedIVaultProperties: createIVaultParams.iVaultProperties,
    });
  });
});
