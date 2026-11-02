/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect } from "chai";

import {
  AuthorizationCallback,
  ClonedFrom,
  GetCreateIVaultOperationDetailsParams,
  IVaultCreationState,
  IVaultsClient,
  IVaultsClientOptions,
} from "@szewtwin/ivaults-client-management";
import {
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestIVaultFileProvider,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestSZEWTwinProvider,
  TestUtilTypes,
} from "@szewtwin/ivaults-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] OperationOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;
  let szewTwinId: string;

  let testIVaultFileProvider: TestIVaultFileProvider;
  let testIVault: ReusableIVaultMetadata;
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
      testSuiteName: "ManagementOperationOperations",
    });

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVault = await reusableTestIVaultProvider.getOrCreate();
  });

  it("should get create iVault operation details", async () => {
    // Arrange
    const operationParams: GetCreateIVaultOperationDetailsParams = {
      authorization,
      iVaultId: testIVault.id,
    };

    // Act
    const operationDetails =
      await iVaultsClient.operations.getCreateIVaultDetails(operationParams);

    // Assert
    expect(operationDetails.clonedFrom).to.be.null;
    expect(operationDetails.state).to.equal(IVaultCreationState.Successful);
  });

  it("should get create iVault operation details of cloned iVault", async () => {
    // Arrange
    const expectedClonedFrom: ClonedFrom = {
      iVaultId: testIVault.id,
      changesetId: testIVaultFileProvider.changesets[0].id,
    };
    const newIVault = await iVaultsClient.iVaults.clone({
      authorization,
      iVaultId: expectedClonedFrom.iVaultId,
      iVaultProperties: {
        szewTwinId,
        name: testIVaultGroup.getPrefixedUniqueIVaultName(
          "cloned iVault for get create iVault operation details"
        ),
        changesetId: expectedClonedFrom.changesetId,
      },
    });
    const operationParams: GetCreateIVaultOperationDetailsParams = {
      authorization,
      iVaultId: newIVault.id,
    };

    // Act
    const operationDetails =
      await iVaultsClient.operations.getCreateIVaultDetails(operationParams);

    // Assert
    expect(operationDetails.clonedFrom).to.deep.equal(expectedClonedFrom);
    expect(operationDetails.state).to.equal(IVaultCreationState.Successful);
  });
});
