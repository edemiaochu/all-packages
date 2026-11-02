/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { IVaultsApiUrlFormatter } from "@szewtwin/ivaults-client-authoring";

describe("[Authoring] IVaultsApiUrlFormatter", () => {
  let iVaultsApiUrlFormatter: IVaultsApiUrlFormatter;
  let iVaultsApibaseUrl: string;

  before(() => {
    iVaultsApibaseUrl = "https://api.szewec.com/ivaults";
    iVaultsApiUrlFormatter = new IVaultsApiUrlFormatter(iVaultsApibaseUrl);
  });

  describe("Baseline urls", () => {
    it("should format baseline url", () => {
      // Arrange
      const getBaselineUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const baselineUrl =
        iVaultsApiUrlFormatter.getBaselineUrl(getBaselineUrlParams);

      // Assert
      expect(baselineUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/baselinefile"
      );
    });
  });

  describe("Lock urls", () => {
    it("should format lock list url", () => {
      // Arrange
      const getLockListUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const lockListUrl =
        iVaultsApiUrlFormatter.getLockListUrl(getLockListUrlParams);

      // Assert
      expect(lockListUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/locks"
      );
    });
  });
});
