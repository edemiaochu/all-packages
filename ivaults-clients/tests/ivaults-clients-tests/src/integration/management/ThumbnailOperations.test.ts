/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

import {
  AuthorizationCallback,
  ContentType,
  DownloadThumbnailParams,
  IVaultScopedOperationParams,
  IVaultsClient,
  IVaultsClientOptions,
  Thumbnail,
  ThumbnailSize,
  UploadThumbnailParams,
} from "@szewtwin/ivaults-client-management";
import {
  IVaultMetadata,
  ReusableIVaultMetadata,
  ReusableTestIVaultProvider,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultGroup,
  TestIVaultGroupFactory,
  TestUtilTypes,
  assertThumbnail,
  cleanupDirectory,
  createGuidValue,
} from "@szewtwin/ivaults-client-test-utils";

chai.use(chaiAsPromised);

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] ThumbnailOperations", () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;

  let testIVaultGroup: TestIVaultGroup;
  let testIVaultForRead: ReusableIVaultMetadata;
  let testIVaultForWrite: IVaultMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iVaultsClientOptions = container.get<IVaultsClientOptions>(
      TestUtilTypes.IVaultsClientOptions
    );
    iVaultsClient = new IVaultsClient(iVaultsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const testIVaultGroupFactory = container.get(TestIVaultGroupFactory);
    testIVaultGroup = testIVaultGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "ManagementThumbnailOperations",
    });

    const reusableTestIVaultProvider = container.get(
      ReusableTestIVaultProvider
    );
    testIVaultForRead = await reusableTestIVaultProvider.getOrCreate();

    const testIVaultCreator = container.get(TestIVaultCreator);
    testIVaultForWrite = await testIVaultCreator.createEmpty(
      testIVaultGroup.getPrefixedUniqueIVaultName("Test iVault for write")
    );
  });

  afterEach(async () => {
    await cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  it("should download a small thumbnail", async () => {
    // Arrange
    const downloadThumbnailParams: DownloadThumbnailParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
    };

    // Act
    const thumbnail: Thumbnail = await iVaultsClient.thumbnails.download(
      downloadThumbnailParams
    );

    // Assert
    assertThumbnail({
      actualThumbnail: thumbnail,
      expectedThumbnailProperties: {
        size: ThumbnailSize.Small,
      },
    });

    const saveFilePromise = saveThumbnailToFile(thumbnail);
    await expect(saveFilePromise).to.eventually.be.fulfilled;
  });

  it("should download a large thumbnail", async () => {
    // Arrange
    const downloadThumbnailParams: DownloadThumbnailParams = {
      authorization,
      iVaultId: testIVaultForRead.id,
      urlParams: {
        size: ThumbnailSize.Large,
      },
    };

    // Act
    const thumbnail: Thumbnail = await iVaultsClient.thumbnails.download(
      downloadThumbnailParams
    );

    // Assert
    assertThumbnail({
      actualThumbnail: thumbnail,
      expectedThumbnailProperties: {
        size: ThumbnailSize.Large,
      },
    });

    const saveFilePromise = saveThumbnailToFile(thumbnail);
    await expect(saveFilePromise).to.eventually.be.fulfilled;
  });

  [
    {
      label: "png",
      contentType: ContentType.Png,
      fileToUploadPath: path.join(Constants.AssetsDirectoryPath, "Sample.png"),
    } as const,
    {
      label: "jpeg",
      contentType: ContentType.Jpeg,
      fileToUploadPath: path.join(Constants.AssetsDirectoryPath, "Sample.jpeg"),
    } as const,
  ].forEach((testCase) => {
    it(`should upload a ${testCase.label} thumbnail`, async () => {
      // Arrange
      const iVaultScopedOperationParams: IVaultScopedOperationParams = {
        authorization,
        iVaultId: testIVaultForWrite.id,
      };
      const initialThumbnail: Thumbnail =
        await iVaultsClient.thumbnails.download(iVaultScopedOperationParams);

      const fileContents: Buffer = await fs.promises.readFile(
        testCase.fileToUploadPath
      );
      const uploadThumbnailParams: UploadThumbnailParams = {
        ...iVaultScopedOperationParams,
        thumbnailProperties: {
          imageType: testCase.contentType,
          image: fileContents,
        },
      };

      // Act
      await iVaultsClient.thumbnails.upload(uploadThumbnailParams);

      // Assert
      const newThumbnail: Thumbnail = await iVaultsClient.thumbnails.download(
        iVaultScopedOperationParams
      );
      expect(newThumbnail.image.length).to.not.be.equal(
        initialThumbnail.image.length
      );
    });
  });

  async function saveThumbnailToFile(thumbnail: Thumbnail): Promise<void> {
    const downloadDirectory = path.join(
      Constants.TestDownloadDirectoryPath,
      "[Management] ThumbnailOperations"
    );
    await fs.promises.mkdir(downloadDirectory, { recursive: true });
    const targetFilePath = path.join(
      downloadDirectory,
      `test download - ${createGuidValue()}.png`
    );
    await fs.promises.writeFile(
      targetFilePath,
      Buffer.from(thumbnail.image.buffer),
      "binary"
    );
  }
});
