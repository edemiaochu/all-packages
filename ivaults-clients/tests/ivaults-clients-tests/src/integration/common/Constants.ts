/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as path from "path";

export class Constants {
  public static TestDownloadDirectoryPath = path.join(
    __dirname,
    "../testDownloads"
  );
  public static AssetsDirectoryPath = path.join(__dirname, "../../assets");
  public static PackagePrefix = "IVaultsClientsTests";
  public static TestDeviceName = "Test device";
}
