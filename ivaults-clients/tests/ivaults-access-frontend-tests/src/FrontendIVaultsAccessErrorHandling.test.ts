/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { SZEWTwinError } from "@szewtwin/core-szewec";
import { IVaultVersion } from "@szewtwin/core-common";
import { IVaultIdArg } from "@szewtwin/core-frontend";
import { FrontendIVaultsAccess } from "@szewtwin/ivaults-access-frontend";
import {
  IVaultsClient,
  IVaultsClientOptions,
  IVaultsErrorCode,
  IVaultsErrorScope,
} from "@szewtwin/ivaults-client-management";
import {
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestUtilTypes,
} from "@szewtwin/ivaults-client-test-utils";

import { getTestDIContainer } from "./TestDiContainerProvider";

describe("FrontendIVaultsAccess error handling", () => {
  let frontendIVaultsAccess: FrontendIVaultsAccess;
  let accessToken: string;
  let testIVaultForRead: ReusableIVaultMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iVaultsClientOptions = container.get<IVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    const iVaultsClient = new IVaultsClient(iVaultsClientOptions);
    frontendIVaultsAccess = new FrontendIVaultsAccess(iVaultsClient);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    const authorizationCallback =
      authorizationProvider.getAdmin1Authorization();
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVaultForRead = await reusableTestIVaultProvider.getOrCreate();
  });

  it("should throw SZEWTwinError if iVault does not exist when querying latest changeset", async () => {
    const getLatestChangesetParams: IVaultIdArg = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIVaultsAccess.getLatestChangeset(getLatestChangesetParams),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when resolving changeset for version (IVaultVersion.named)", async () => {
    const getChangesetFromVersionParams: IVaultIdArg & {
      version: IVaultVersion;
    } = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
      version: IVaultVersion.named("non existent named version"),
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if named version does not exist when resolving changeset from version", async () => {
    const getChangesetFromVersionParams: IVaultIdArg & {
      version: IVaultVersion;
    } = {
      accessToken,
      iVaultId: testIVaultForRead.id,
      version: IVaultVersion.named("non existent named version"),
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IVaultsErrorCode.NamedVersionNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when resolving changeset for version (IVaultVersion.asOfChangeSet)", async () => {
    const getChangesetFromVersionParams: IVaultIdArg & {
      version: IVaultVersion;
    } = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
      version: IVaultVersion.asOfChangeSet("nonExistentChangesetId"),
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if changeset does not exist when resolving changeset from version", async () => {
    const getChangesetFromVersionParams: IVaultIdArg & {
      version: IVaultVersion;
    } = {
      accessToken,
      iVaultId: testIVaultForRead.id,
      version: IVaultVersion.asOfChangeSet("nonExistentChangesetId"),
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IVaultsErrorCode.ChangesetNotFound
    );
  });

  it("should throw SZEWTwinError if iVault does not exist when resolving changeset from latest version", async () => {
    const getChangesetFromVersionParams: IVaultIdArg & {
      version: IVaultVersion;
    } = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
      version: IVaultVersion.latest(),
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if IVault does not exist when querying changeset for named version", async () => {
    const getChangesetFromNamedVersionParams: IVaultIdArg & {
      versionName: string;
    } = {
      accessToken,
      iVaultId: "nonExistentiVaultId",
      versionName: "non existent named version",
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIVaultsAccess.getChangesetFromNamedVersion(
          getChangesetFromNamedVersionParams
        ),
      IVaultsErrorCode.IVaultNotFound
    );
  });

  it("should throw SZEWTwinError if Named Version does not exist when querying changeset for named version", async () => {
    const getChangesetFromNamedVersionParams: IVaultIdArg & {
      versionName: string;
    } = {
      accessToken,
      iVaultId: testIVaultForRead.id,
      versionName: "non existent named version",
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIVaultsAccess.getChangesetFromNamedVersion(
          getChangesetFromNamedVersionParams
        ),
      IVaultsErrorCode.NamedVersionNotFound
    );
  });

  async function executeFuncAndAssertError(
    func: () => Promise<void> | Promise<unknown>,
    expectedErrorCode: string
  ): Promise<void> {
    let thrownError: unknown;
    try {
      await func();
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(
      SZEWTwinError.isError(thrownError, IVaultsErrorScope, expectedErrorCode)
    ).to.be.true;
    expect(thrownError).to.not.be.undefined;
    expect((thrownError as SZEWTwinError).message).to.not.be.empty;
  }
});
