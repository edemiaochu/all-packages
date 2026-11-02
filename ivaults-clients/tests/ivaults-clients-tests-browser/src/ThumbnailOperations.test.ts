/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  ApiOptions,
  Authorization,
  AuthorizationCallback,
  ContentType,
  DownloadThumbnailParams,
  IVaultScopedOperationParams,
  IVaultsClient,
  Thumbnail,
  ThumbnailOperations,
  ThumbnailSize,
  UploadThumbnailParams,
} from "@szewtwin/ivaults-client-management";
import { assertThumbnail } from "@szewtwin/ivaults-client-test-utils/lib/assertions/BrowserFriendlyAssertions";

import { FrontendTestEnvVariableKeys } from "./setup/FrontendTestEnvVariableKeys";

describe(`[Management] ${ThumbnailOperations.name}`, () => {
  let iVaultsClient: IVaultsClient;
  let authorization: AuthorizationCallback;

  let testIVaultForReadId: string;
  let testIVaultForWriteId: string;

  let testPngFilePath: string;

  before(async () => {
    const iVaultsClientApiOptions: ApiOptions = JSON.parse(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Cypress.env(FrontendTestEnvVariableKeys.iVaultsClientApiOptions)
    );
    iVaultsClient = new IVaultsClient({ api: iVaultsClientApiOptions });

    const admin1AuthorizationInfo: Authorization = JSON.parse(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Cypress.env(FrontendTestEnvVariableKeys.admin1AuthorizationInfo)
    );
    authorization = () => Promise.resolve(admin1AuthorizationInfo);

    testIVaultForReadId = Cypress.env(
      FrontendTestEnvVariableKeys.testIVaultForReadId
    );

    const szewTwinId: string = Cypress.env(
      FrontendTestEnvVariableKeys.testSZEWTwinId
    );
    const uniqueId = new Date().getTime();
    const testIVaultForWrite = await iVaultsClient.iVaults.createEmpty({
      authorization,
      iVaultProperties: {
        szewTwinId,
        name: `Thumbnail browser tests [${uniqueId}]`,
      },
    });
    testIVaultForWriteId = testIVaultForWrite.id;

    testPngFilePath = Cypress.env(FrontendTestEnvVariableKeys.testPngFilePath);
  });

  after(async () => {
    if (!testIVaultForWriteId) return;

    await iVaultsClient.iVaults.delete({
      authorization,
      iVaultId: testIVaultForWriteId,
    });
  });

  it("should download a small thumbnail", async () => {
    // Arrange
    const downloadThumbnailParams: DownloadThumbnailParams = {
      authorization,
      iVaultId: testIVaultForReadId,
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
  });

  it("should upload a png thumbnail", async () => {
    // Arrange
    const iVaultScopedOperationParams: IVaultScopedOperationParams = {
      authorization,
      iVaultId: testIVaultForWriteId,
    };
    const initialThumbnail: Thumbnail = await iVaultsClient.thumbnails.download(
      iVaultScopedOperationParams
    );

    const testPngFileBytes = await readFile(testPngFilePath);
    const uploadThumbnailParams: UploadThumbnailParams = {
      ...iVaultScopedOperationParams,
      thumbnailProperties: {
        imageType: ContentType.Png,
        image: testPngFileBytes,
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

  async function readFile(filePath: string): Promise<Uint8Array> {
    return new Promise((resolve) => {
      cy.readFile(filePath, "binary").then((stringContent: string) => {
        const binaryContent = Uint8Array.from(stringContent, (x) =>
          x.charCodeAt(0)
        );
        resolve(binaryContent);
      });
    });
  }
});
