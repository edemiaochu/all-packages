/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { ChangesetIndexAndId, IVaultVersion } from "@szewtwin/core-common";
import { IVaultIdArg } from "@szewtwin/core-frontend";
import { FrontendIVaultsAccess } from "@szewtwin/ivaults-access-frontend";
import {
  IVaultsClient,
  IVaultsClientOptions,
} from "@szewtwin/ivaults-client-management";
import {
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestIVaultFileProvider,
  TestUtilTypes,
} from "@szewtwin/ivaults-client-test-utils";

import { getTestDIContainer } from "./TestDiContainerProvider";

describe("FrontendIVaultsAccess", () => {
  let frontendIVaultsAccess: FrontendIVaultsAccess;
  let accessToken: string;
  let testIVaultFileProvider: TestIVaultFileProvider;
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

    testIVaultFileProvider = container.get(TestIVaultFileProvider);

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVaultForRead = await reusableTestIVaultProvider.getOrCreate();
  });

  describe("getLatestChangeset", () => {
    it("should return latest changeset", async () => {
      // Arrange
      const getLatestChangesetParams: IVaultIdArg = {
        accessToken,
        iVaultId: testIVaultForRead.id,
      };

      // Act
      const latestChangeset: ChangesetIndexAndId =
        await frontendIVaultsAccess.getLatestChangeset(
          getLatestChangesetParams
        );

      // Assert
      const expectedChangesetFile =
        testIVaultFileProvider.changesets[
          testIVaultFileProvider.changesets.length - 1
        ];
      expect(latestChangeset.id).to.be.equal(expectedChangesetFile.id);
      expect(latestChangeset.index).to.be.equal(expectedChangesetFile.index);
    });
  });

  describe("getChangesetFromVersion", () => {
    it("should retrieve correct changeset info when iVault version is first", async () => {
      // Arrange
      const getChangesetFromVersionParams: IVaultIdArg & {
        version: IVaultVersion;
      } = {
        accessToken,
        iVaultId: testIVaultForRead.id,
        version: IVaultVersion.first(),
      };

      // Act
      const changesetFromVersion: ChangesetIndexAndId =
        await frontendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        );

      // Assert
      expect(changesetFromVersion.id).to.be.equal("");
      expect(changesetFromVersion.index).to.be.equal(0);
    });

    it("should retrieve correct changeset info when iVault version is on a specific changeset", async () => {
      // Arrange
      const testChangesetFile = testIVaultFileProvider.changesets[3];
      const getChangesetFromVersionParams: IVaultIdArg & {
        version: IVaultVersion;
      } = {
        accessToken,
        iVaultId: testIVaultForRead.id,
        version: IVaultVersion.asOfChangeSet(testChangesetFile.id),
      };

      // Act
      const changesetFromVersion: ChangesetIndexAndId =
        await frontendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        );

      // Assert
      expect(changesetFromVersion.id).to.be.equal(testChangesetFile.id);
      expect(changesetFromVersion.index).to.be.equal(testChangesetFile.index);
    });

    it("should retrieve correct changeset info when iVault version is on a specific named version", async () => {
      // Arrange
      const testIVaultNamedVersion = testIVaultForRead.namedVersions[0];
      const getChangesetFromVersionParams: IVaultIdArg & {
        version: IVaultVersion;
      } = {
        accessToken,
        iVaultId: testIVaultForRead.id,
        version: IVaultVersion.named(testIVaultNamedVersion.name),
      };

      // Act
      const changesetFromVersion: ChangesetIndexAndId =
        await frontendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        );

      // Assert
      expect(changesetFromVersion.id).to.be.equal(
        testIVaultNamedVersion.changesetId
      );
      expect(changesetFromVersion.index).to.be.equal(
        testIVaultNamedVersion.changesetIndex
      );
    });

    it("should retrieve correct changeset info when iVault version is last", async () => {
      // Arrange
      const getChangesetFromVersionParams: IVaultIdArg & {
        version: IVaultVersion;
      } = {
        accessToken,
        iVaultId: testIVaultForRead.id,
        version: IVaultVersion.latest(),
      };

      // Act
      const changesetFromVersion: ChangesetIndexAndId =
        await frontendIVaultsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        );

      // Assert
      const latestTestChangesetFile =
        testIVaultFileProvider.changesets[
          testIVaultFileProvider.changesets.length - 1
        ];
      expect(changesetFromVersion.id).to.be.equal(latestTestChangesetFile.id);
      expect(changesetFromVersion.index).to.be.equal(
        latestTestChangesetFile.index
      );
    });
  });

  describe("getChangesetFromNamedVersion", () => {
    it("should return changeset of the exact named version when named version name is provided", async () => {
      // Arrange
      const testIVaultNamedVersion = testIVaultForRead.namedVersions[0];
      const getChangesetFromNamedVersionParams: IVaultIdArg & {
        versionName?: string;
      } = {
        accessToken,
        iVaultId: testIVaultForRead.id,
        versionName: testIVaultNamedVersion.name,
      };

      // Act
      const changesetFromNamedVersion: ChangesetIndexAndId =
        await frontendIVaultsAccess.getChangesetFromNamedVersion(
          getChangesetFromNamedVersionParams
        );

      // Assert
      const expectedChangesetFile =
        testIVaultFileProvider.changesets[
          testIVaultNamedVersion.changesetIndex - 1
        ];
      expect(changesetFromNamedVersion.id).to.be.equal(
        expectedChangesetFile.id
      );
      expect(changesetFromNamedVersion.index).to.be.equal(
        expectedChangesetFile.index
      );
    });

    it("should return the latest changeset when named version name is not provided", async () => {
      // Arrange
      const getChangesetFromNamedVersionParams: IVaultIdArg & {
        versionName?: string;
      } = {
        accessToken,
        iVaultId: testIVaultForRead.id,
      };

      // Act
      const changesetFromNamedVersion: ChangesetIndexAndId =
        await frontendIVaultsAccess.getChangesetFromNamedVersion(
          getChangesetFromNamedVersionParams
        );

      // Assert
      const latestTestIVaultNamedVersion =
        testIVaultForRead.namedVersions[
          testIVaultForRead.namedVersions.length - 1
        ];
      const expectedChangesetFile =
        testIVaultFileProvider.changesets[
          latestTestIVaultNamedVersion.changesetIndex - 1
        ];
      expect(changesetFromNamedVersion.id).to.be.equal(
        expectedChangesetFile.id
      );
      expect(changesetFromNamedVersion.index).to.be.equal(
        expectedChangesetFile.index
      );
    });
  });
});
