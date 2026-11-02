/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";

import { injectable } from "inversify";

import { SynchronizationInfoForCreate } from "@szewtwin/ivaults-client-authoring";

import { TestSetupError } from "../../CommonTestUtils";

export interface TestIVaultBaselineFile {
  filePath: string;
}

export interface TestChangesetFile {
  id: string;
  index: number;
  description: string;
  parentId: string;
  containingChanges: number;
  synchronizationInfo?: SynchronizationInfoForCreate;
  filePath: string;
}

interface ChangesetDescriptorFile {
  changesets: ChangesetDescriptorFileItem[];
}

interface ChangesetDescriptorFileItem extends TestChangesetFile {
  fileName: string;
}

@injectable()
export class TestIVaultFileProvider {
  private readonly _iVaultDataRootPath = `${__dirname}/../../assets/test-ivault`;
  private _baselineFile: TestIVaultBaselineFile | undefined;
  private _changesetFiles: TestChangesetFile[] | undefined;

  public get iVault(): TestIVaultBaselineFile {
    return this._baselineFile ?? this.initializeBaselineFile();
  }

  public get changesets(): TestChangesetFile[] {
    return this._changesetFiles ?? this.initializeChangesetFiles();
  }

  private initializeBaselineFile(): TestIVaultBaselineFile {
    const fileNamesInDirectory = fs.readdirSync(this._iVaultDataRootPath);
    const bimFile = fileNamesInDirectory.find(
      (fileName) => fileName.indexOf(".bim") >= 0
    );
    if (!bimFile)
      throw new TestSetupError("Baseline file for test iVault not found.");

    this._baselineFile = {
      filePath: `${this._iVaultDataRootPath}/${bimFile}`,
    };
    return this._baselineFile;
  }

  private initializeChangesetFiles(): TestChangesetFile[] {
    const changesetDescriptorFilePath = `${this._iVaultDataRootPath}/changesets.json`;
    if (!fs.existsSync(changesetDescriptorFilePath))
      throw new TestSetupError(
        "Changeset descriptor file for test iVault not found."
      );

    const changesetDescriptorFileString = fs.readFileSync(
      changesetDescriptorFilePath,
      "utf8"
    );
    const changesetDescriptorFile: ChangesetDescriptorFile = JSON.parse(
      changesetDescriptorFileString
    );
    if (!changesetDescriptorFile?.changesets)
      throw new TestSetupError(
        "Changeset descriptor file does not contain expected data."
      );

    this._changesetFiles = changesetDescriptorFile.changesets.map((cs) => {
      const changesetFilePath = `${this._iVaultDataRootPath}/changesets/${cs.fileName}`;
      if (!fs.existsSync(changesetFilePath))
        throw new TestSetupError("Changeset file for test iVault not found.");
      return { ...cs, filePath: changesetFilePath };
    });

    return this._changesetFiles;
  }
}
