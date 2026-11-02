/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  IVaultOrderByProperty,
  IVaultsApiUrlFormatter,
  OrderByOperator,
} from "@szewtwin/ivaults-client-management";

describe("[Management] IVaultsApiUrlFormatter", () => {
  let iVaultsApiUrlFormatter: IVaultsApiUrlFormatter;
  let iVaultsApiBaseUrl: string;

  before(() => {
    iVaultsApiBaseUrl = "https://api.szewec.com/ivaults";
    iVaultsApiUrlFormatter = new IVaultsApiUrlFormatter(iVaultsApiBaseUrl);
  });

  describe("iVault urls", () => {
    it("should format create iVault url", () => {
      // Act
      const createIVaultUrl = iVaultsApiUrlFormatter.getCreateIVaultUrl();

      // Assert
      expect(createIVaultUrl).to.be.equal("https://api.szewec.com/ivaults");
    });

    it("should format clone iVault url", () => {
      // Arrange
      const getCloneIVaultUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const cloneIVaultUrl = iVaultsApiUrlFormatter.getCloneIVaultUrl(
        getCloneIVaultUrlParams
      );

      // Assert
      expect(cloneIVaultUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/clone"
      );
    });

    it("should format single iVault url", () => {
      // Arrange
      const getSingleIVaultUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const singleIVaultUrl = iVaultsApiUrlFormatter.getSingleIVaultUrl(
        getSingleIVaultUrlParams
      );

      // Assert
      expect(singleIVaultUrl).to.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID"
      );
    });

    it("should format iVault list url", () => {
      // Arrange
      const getIVaultListUrlParams = {
        iVaultId: "IVAULT_ID",
        urlParams: { szewTwinId: "SZEWTWIN_ID" },
      };

      // Act
      const iVaultListUrl = iVaultsApiUrlFormatter.getIVaultListUrl(
        getIVaultListUrlParams
      );

      // Assert
      expect(iVaultListUrl).to.equal(
        "https://api.szewec.com/ivaults?szewTwinId=SZEWTWIN_ID"
      );
    });

    it("should parse iVault url", () => {
      // Arrange
      const iVaultUrl = "https://api.szewec.com/ivaults/IVAULT_ID";

      // Act
      const { iVaultId } = iVaultsApiUrlFormatter.parseIVaultUrl(iVaultUrl);

      // Assert
      expect(iVaultId).to.be.equal("IVAULT_ID");
    });
  });

  describe("Briefcase urls", () => {
    it("should format single Briefcase url", () => {
      // Arrange
      const getSingleBriefcaseUrlParams = {
        iVaultId: "IVAULT_ID",
        briefcaseId: 2,
      };

      // Act
      const singleBriefcaseUrl = iVaultsApiUrlFormatter.getSingleBriefcaseUrl(
        getSingleBriefcaseUrlParams
      );

      // Assert
      expect(singleBriefcaseUrl).to.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/briefcases/2"
      );
    });

    it("should format Briefcase list url", () => {
      // Arrange
      const getBriefcaseListUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const briefcaseListUrl = iVaultsApiUrlFormatter.getBriefcaseListUrl(
        getBriefcaseListUrlParams
      );

      // Assert
      expect(briefcaseListUrl).to.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/briefcases"
      );
    });
  });

  describe("Named Version urls", () => {
    it("should format single Named Version url", () => {
      // Arrange
      const getSingleNamedVersionUrl = {
        iVaultId: "IVAULT_ID",
        namedVersionId: "NAMED_VERSION_ID",
      };

      // Act
      const singleNamedVersionUrl =
        iVaultsApiUrlFormatter.getSingleNamedVersionUrl(
          getSingleNamedVersionUrl
        );

      // Assert
      expect(singleNamedVersionUrl).to.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/namedversions/NAMED_VERSION_ID"
      );
    });

    it("should format Named Version list url", () => {
      // Arrange
      const getNamedVersionListUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const namedVersionListUrl = iVaultsApiUrlFormatter.getNamedVersionListUrl(
        getNamedVersionListUrlParams
      );

      // Assert
      expect(namedVersionListUrl).to.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/namedversions"
      );
    });

    it("should parse named version url", () => {
      // Arrange
      const namedVersionUrl =
        "https://api.szewec.com/ivaults/IVAULT_ID/namedversions/NAMED_VERSION_ID";

      // Act
      const { iVaultId, namedVersionId } =
        iVaultsApiUrlFormatter.parseNamedVersionUrl(namedVersionUrl);

      // Assert
      expect(iVaultId).to.be.equal("IVAULT_ID");
      expect(namedVersionId).to.be.equal("NAMED_VERSION_ID");
    });
  });

  describe("Changeset urls", () => {
    it("should format changeset list url", () => {
      // Arrange
      const getChangesetListUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const changesetListUrl = iVaultsApiUrlFormatter.getChangesetListUrl(
        getChangesetListUrlParams
      );

      // Assert
      expect(changesetListUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/changesets"
      );
    });

    it("should format single changeset url with id", () => {
      // Arrange
      const getSingleChangesetUrlParams = {
        iVaultId: "IVAULT_ID",
        changesetId: "CHANGESET_ID",
      };

      // Act
      const singleChangesetUrl = iVaultsApiUrlFormatter.getSingleChangesetUrl(
        getSingleChangesetUrlParams
      );

      // Assert
      expect(singleChangesetUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/changesets/CHANGESET_ID"
      );
    });

    it("should format single changeset url with index", () => {
      // Arrange
      const getSingleChangesetUrlParams = {
        iVaultId: "IVAULT_ID",
        changesetIndex: 5,
      };

      // Act
      const singleChangesetUrl = iVaultsApiUrlFormatter.getSingleChangesetUrl(
        getSingleChangesetUrlParams
      );

      // Assert
      expect(singleChangesetUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/changesets/5"
      );
    });

    [
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/5",
        expectedChangesetIndex: 5,
      },
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/5/",
        expectedChangesetIndex: 5,
      },
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/55555555",
        expectedChangesetIndex: 55555555,
      },
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/9007199254740991",
        expectedChangesetIndex: 9007199254740991,
      },
    ].forEach((testCase) => {
      it(`should parse changeset url with index ${testCase.expectedChangesetIndex}`, () => {
        // Act
        const { iVaultId, changesetId, changesetIndex } =
          iVaultsApiUrlFormatter.parseChangesetUrl(testCase.url);

        // Assert
        expect(iVaultId).to.be.equal("IVAULT_ID");
        expect(changesetId).to.be.undefined;
        expect(changesetIndex).to.be.equal(testCase.expectedChangesetIndex);
      });
    });

    [
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/CHANGESET_ID",
        expectedChangesetId: "CHANGESET_ID",
      },
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/CHANGESET_ID/",
        expectedChangesetId: "CHANGESET_ID",
      },
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/5555555555555555555555555555555555555555",
        expectedChangesetId: "5555555555555555555555555555555555555555",
      },
    ].forEach((testCase) => {
      it(`should parse changeset url with id (${testCase.expectedChangesetId})`, () => {
        // Act
        const { iVaultId, changesetId, changesetIndex } =
          iVaultsApiUrlFormatter.parseChangesetUrl(testCase.url);

        // Assert
        expect(iVaultId).to.be.equal("IVAULT_ID");
        expect(changesetId).to.be.equal(testCase.expectedChangesetId);
        expect(changesetIndex).to.be.undefined;
      });
    });
  });

  describe("Changeset Extended Data urls", () => {
    it("should format changeset extended data list url", () => {
      // Arrange
      const getChangesetExtendedDataListUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const changesetExtendedDataListUrl =
        iVaultsApiUrlFormatter.getChangesetExtendedDataListUrl(
          getChangesetExtendedDataListUrlParams
        );

      // Assert
      expect(changesetExtendedDataListUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/changesets/extendeddata"
      );
    });
  });

  describe("Changeset Group urls", () => {
    it("should format changeset group list url", () => {
      // Arrange
      const getChangesetGroupListUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const changesetGroupListUrl =
        iVaultsApiUrlFormatter.getChangesetGroupListUrl(
          getChangesetGroupListUrlParams
        );

      // Assert
      expect(changesetGroupListUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/changesetgroups"
      );
    });

    it("should format single changeset group url", () => {
      // Arrange
      const getSingleChangesetGroupUrlParams = {
        iVaultId: "IVAULT_ID",
        changesetGroupId: "GROUP_ID",
      };

      // Act
      const singleChangesetGroupUrl =
        iVaultsApiUrlFormatter.getSingleChangesetGroupUrl(
          getSingleChangesetGroupUrlParams
        );

      // Assert
      expect(singleChangesetGroupUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/changesetgroups/GROUP_ID"
      );
    });
  });

  describe("Checkpoint urls", () => {
    [
      {
        params: { iVaultId: "IVAULT_ID" },
        expectedUrl:
          "https://api.szewec.com/ivaults/IVAULT_ID/briefcases/checkpoint",
      },
      {
        params: { iVaultId: "IVAULT_ID", namedVersionId: "NAMED_VERSION_ID" },
        expectedUrl:
          "https://api.szewec.com/ivaults/IVAULT_ID/namedversions/NAMED_VERSION_ID/checkpoint",
      },
      {
        params: { iVaultId: "IVAULT_ID", changesetId: "CHANGESET_ID" },
        expectedUrl:
          "https://api.szewec.com/ivaults/IVAULT_ID/changesets/CHANGESET_ID/checkpoint",
      },
      {
        params: { iVaultId: "IVAULT_ID", changesetIndex: 0 },
        expectedUrl:
          "https://api.szewec.com/ivaults/IVAULT_ID/changesets/0/checkpoint",
      },
      {
        params: { iVaultId: "IVAULT_ID", changesetIndex: 17 },
        expectedUrl:
          "https://api.szewec.com/ivaults/IVAULT_ID/changesets/17/checkpoint",
      },
    ].forEach((testCase) => {
      it("should format checkpoint url", () => {
        // Act
        const checkpointUrl = iVaultsApiUrlFormatter.getCheckpointUrl(
          testCase.params
        );

        // Assert
        expect(checkpointUrl).to.be.equal(testCase.expectedUrl);
      });
    });

    [
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/5/checkpoint",
        expectedChangesetIndex: 5,
      },
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/5/checkpoint/",
        expectedChangesetIndex: 5,
      },
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/55555555/checkpoint",
        expectedChangesetIndex: 55555555,
      },
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/9007199254740991/checkpoint",
        expectedChangesetIndex: 9007199254740991,
      },
    ].forEach((testCase) => {
      it(`should parse checkpointUrl url with index ${testCase.expectedChangesetIndex}`, () => {
        // Act
        const { iVaultId, changesetId, changesetIndex } =
          iVaultsApiUrlFormatter.parseCheckpointUrl(testCase.url);

        // Assert
        expect(iVaultId).to.be.equal("IVAULT_ID");
        expect(changesetId).to.be.undefined;
        expect(changesetIndex).to.be.equal(testCase.expectedChangesetIndex);
      });
    });

    [
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/CHANGESET_ID5/checkpoint",
        expectedChangesetId: "CHANGESET_ID5",
      },
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/CHANGESET_ID/checkpoint/",
        expectedChangesetId: "CHANGESET_ID",
      },
      {
        url: "https://api.szewec.com/ivaults/IVAULT_ID/changesets/5555555555555555555555555555555555555555/checkpoint",
        expectedChangesetId: "5555555555555555555555555555555555555555",
      },
    ].forEach((testCase) => {
      it(`should parse checkpointUrl url with id (${testCase.expectedChangesetId})`, () => {
        // Act
        const { iVaultId, changesetId, changesetIndex } =
          iVaultsApiUrlFormatter.parseCheckpointUrl(testCase.url);

        // Assert
        expect(iVaultId).to.be.equal("IVAULT_ID");
        expect(changesetId).to.be.equal(testCase.expectedChangesetId);
        expect(changesetIndex).to.be.undefined;
      });
    });
  });

  describe("Thumbnail urls", () => {
    it("should format thumbnail url", () => {
      // Arrange
      const getThumbnailUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const thumbnailUrl = iVaultsApiUrlFormatter.getThumbnailUrl(
        getThumbnailUrlParams
      );

      // Assert
      expect(thumbnailUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/thumbnail"
      );
    });
  });

  describe("User urls", () => {
    it("should format user list url", () => {
      // Arrange
      const getUserListUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const userListUrl =
        iVaultsApiUrlFormatter.getUserListUrl(getUserListUrlParams);

      // Assert
      expect(userListUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/users"
      );
    });

    it("should format single user url", () => {
      // Arrange
      const getSingleUserUrlParams = {
        iVaultId: "IVAULT_ID",
        userId: "USER_ID",
      };

      // Act
      const singleUserUrl = iVaultsApiUrlFormatter.getSingleUserUrl(
        getSingleUserUrlParams
      );

      // Assert
      expect(singleUserUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/users/USER_ID"
      );
    });

    it("should parse user url", () => {
      // Arrange
      const userUrl = "https://api.szewec.com/ivaults/IVAULT_ID/users/USER_ID";

      // Act
      const { iVaultId, userId } = iVaultsApiUrlFormatter.parseUserUrl(userUrl);

      // Assert
      expect(iVaultId).to.be.equal("IVAULT_ID");
      expect(userId).to.be.equal("USER_ID");
    });
  });

  describe("User Permission urls", () => {
    it("should format permissions url", () => {
      // Arrange
      const getUserPermissionsUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const userPermissionsUrl = iVaultsApiUrlFormatter.getUserPermissionsUrl(
        getUserPermissionsUrlParams
      );

      // Assert
      expect(userPermissionsUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/permissions"
      );
    });
  });

  describe("Operation urls", () => {
    it("should format create iVault operation details url", () => {
      // Arrange
      const getCreateIVaultOperationDetailsUrlParams = {
        iVaultId: "IVAULT_ID",
      };

      // Act
      const getCreateIVaultOperationDetailsUrl =
        iVaultsApiUrlFormatter.getCreateIVaultOperationDetailsUrl(
          getCreateIVaultOperationDetailsUrlParams
        );

      // Assert
      expect(getCreateIVaultOperationDetailsUrl).to.be.equal(
        "https://api.szewec.com/ivaults/IVAULT_ID/operations/create"
      );
    });
  });

  describe("Url parameter forming", () => {
    it("should append all url params", () => {
      // Arrange
      const getIVaultListUrlParams = {
        urlParams: {
          szewTwinId: "SZEWTWIN_ID",
          name: "IVAULT_NAME",
          $skip: 1,
          $top: 2,
          $continuationToken: "TOKEN",
          $orderBy: {
            property: IVaultOrderByProperty.Name,
            operator: OrderByOperator.Ascending,
          },
          testParam1: 1,
          testParam2: "param2",
        },
      };

      // Act
      const iVaultListUrl = iVaultsApiUrlFormatter.getIVaultListUrl(
        getIVaultListUrlParams
      );

      // Assert
      expect(iVaultListUrl).to.be.equal(
        "https://api.szewec.com/ivaults?szewTwinId=SZEWTWIN_ID&name=IVAULT_NAME&$skip=1&$top=2&$continuationToken=TOKEN&$orderBy=name asc&testParam1=1&testParam2=param2"
      );
    });

    [
      {
        label: "single property asc",
        orderBy: {
          property: IVaultOrderByProperty.Name,
          operator: OrderByOperator.Ascending,
        },
        expectedUrlParams: "$orderBy=name asc",
      },
      {
        label: "single property desc",
        orderBy: {
          property: IVaultOrderByProperty.Name,
          operator: OrderByOperator.Descending,
        },
        expectedUrlParams: "$orderBy=name desc",
      },
      {
        label: "single property with no operator",
        orderBy: { property: IVaultOrderByProperty.Name },
        expectedUrlParams: "$orderBy=name",
      },
      {
        label: "multiple properties",
        orderBy: [
          {
            property: IVaultOrderByProperty.Name,
            operator: OrderByOperator.Ascending,
          },
          {
            property: IVaultOrderByProperty.CreatedDateTime,
            operator: OrderByOperator.Descending,
          },
        ],
        expectedUrlParams: "$orderBy=name asc,createdDateTime desc",
      },
      {
        label: "multiple properties with no operator",
        orderBy: [
          { property: IVaultOrderByProperty.Name },
          { property: IVaultOrderByProperty.CreatedDateTime },
        ],
        expectedUrlParams: "$orderBy=name,createdDateTime",
      },
    ].forEach((testCase) => {
      it(`should append $orderBy correctly (${testCase.label})`, () => {
        // Arrange
        const getIVaultListUrlParams = {
          urlParams: {
            szewTwinId: "SZEWTWIN_ID",
            $orderBy: testCase.orderBy,
          },
        };

        // Act
        const iVaultListUrl = iVaultsApiUrlFormatter.getIVaultListUrl(
          getIVaultListUrlParams
        );

        // Assert
        expect(iVaultListUrl).to.be.equal(
          `https://api.szewec.com/ivaults?szewTwinId=SZEWTWIN_ID&${testCase.expectedUrlParams}`
        );
      });
    });

    [
      {
        label: "null",
        valueUnderTest: null,
      },
      {
        label: "undefined",
        valueUnderTest: undefined,
      },
      {
        label: "empty string",
        valueUnderTest: "",
      },
      {
        label: "whitespace string",
        valueUnderTest: "  ",
      },
    ].forEach((testCase) => {
      it(`should not append param if it is ${testCase.label}`, () => {
        // Arrange
        const getIVaultListUrlParams = {
          urlParams: {
            szewTwinId: "SZEWTWIN_ID",
            testValue: testCase.valueUnderTest,
          },
        };

        // Act
        const iVaultListUrl = iVaultsApiUrlFormatter.getIVaultListUrl(
          getIVaultListUrlParams
        );

        // Assert
        expect(iVaultListUrl).to.be.equal(
          "https://api.szewec.com/ivaults?szewTwinId=SZEWTWIN_ID"
        );
      });
    });

    it("should append param if it is equal to 0", () => {
      // Arrange
      const getIVaultListUrlParams = {
        urlParams: {
          szewTwinId: "SZEWTWIN_ID",
          testValue: 0,
        },
      };

      // Act
      const iVaultListUrl = iVaultsApiUrlFormatter.getIVaultListUrl(
        getIVaultListUrlParams
      );

      // Assert
      expect(iVaultListUrl).to.be.equal(
        "https://api.szewec.com/ivaults?szewTwinId=SZEWTWIN_ID&testValue=0"
      );
    });
  });

  describe("Favorite iVault urls", () => {
    it("should format favorite iVault list url", () => {
      // Arrange
      const getFavoriteIVaultListUrlParams = {
        urlParams: { szewTwinId: "SZEWTWIN_ID" },
      };

      // Act
      const favoriteIVaultListUrl =
        iVaultsApiUrlFormatter.getFavoriteIVaultListUrl(
          getFavoriteIVaultListUrlParams
        );

      // Assert
      expect(favoriteIVaultListUrl).to.be.equal(
        "https://api.szewec.com/ivaults/favorites?szewTwinId=SZEWTWIN_ID"
      );
    });

    it("should format favorite iVault list url with $top", () => {
      // Arrange
      const getFavoriteIVaultListUrlParams = {
        urlParams: { szewTwinId: "SZEWTWIN_ID", $top: 50 },
      };

      // Act
      const favoriteIVaultListUrl =
        iVaultsApiUrlFormatter.getFavoriteIVaultListUrl(
          getFavoriteIVaultListUrlParams
        );

      // Assert
      expect(favoriteIVaultListUrl).to.be.equal(
        "https://api.szewec.com/ivaults/favorites?szewTwinId=SZEWTWIN_ID&$top=50"
      );
    });

    it("should format favorite iVault list url with $continuationToken", () => {
      // Arrange
      const getFavoriteIVaultListUrlParams = {
        urlParams: {
          szewTwinId: "SZEWTWIN_ID",
          $continuationToken: "TOKEN_123",
        },
      };

      // Act
      const favoriteIVaultListUrl =
        iVaultsApiUrlFormatter.getFavoriteIVaultListUrl(
          getFavoriteIVaultListUrlParams
        );

      // Assert
      expect(favoriteIVaultListUrl).to.be.equal(
        "https://api.szewec.com/ivaults/favorites?szewTwinId=SZEWTWIN_ID&$continuationToken=TOKEN_123"
      );
    });

    it("should format favorite iVault url", () => {
      // Arrange
      const getFavoriteIVaultUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const favoriteIVaultUrl = iVaultsApiUrlFormatter.getFavoriteIVaultUrl(
        getFavoriteIVaultUrlParams
      );

      // Assert
      expect(favoriteIVaultUrl).to.be.equal(
        "https://api.szewec.com/ivaults/favorites/IVAULT_ID"
      );
    });
  });

  describe("Recent iVault urls", () => {
    it("should format recent iVault list url", () => {
      // Arrange
      const getRecentIVaultListUrlParams = {
        urlParams: { szewTwinId: "SZEWTWIN_ID" },
      };

      // Act
      const recentIVaultListUrl = iVaultsApiUrlFormatter.getRecentIVaultListUrl(
        getRecentIVaultListUrlParams
      );

      // Assert
      expect(recentIVaultListUrl).to.be.equal(
        "https://api.szewec.com/ivaults/recents?szewTwinId=SZEWTWIN_ID"
      );
    });

    it("should format recent iVault list url with $top", () => {
      // Arrange
      const getRecentIVaultListUrlParams = {
        urlParams: { szewTwinId: "SZEWTWIN_ID", $top: 25 },
      };

      // Act
      const recentIVaultListUrl = iVaultsApiUrlFormatter.getRecentIVaultListUrl(
        getRecentIVaultListUrlParams
      );

      // Assert
      expect(recentIVaultListUrl).to.be.equal(
        "https://api.szewec.com/ivaults/recents?szewTwinId=SZEWTWIN_ID&$top=25"
      );
    });

    it("should format recent iVault url", () => {
      // Arrange
      const getRecentIVaultUrlParams = { iVaultId: "IVAULT_ID" };

      // Act
      const recentIVaultUrl = iVaultsApiUrlFormatter.getRecentIVaultUrl(
        getRecentIVaultUrlParams
      );

      // Assert
      expect(recentIVaultUrl).to.be.equal(
        "https://api.szewec.com/ivaults/recents/IVAULT_ID"
      );
    });
  });
});
