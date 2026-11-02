/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";

import {
  type AccessToken,
  type GuidString,
  Logger,
  LogLevel,
} from "@szewtwin/core-szewec";
import { CartographicRange, type RealityData } from "@szewtwin/core-common";
import { Point3d, Range3d, Transform } from "@szewtwin/core-geometry";

import {
  ApiVersion,
  RealityDataAccessClient,
  type RealityDataClientOptions,
  type RealityDataQueryCriteria,
} from "../../RealityDataClient";
import { TestConfig } from "../TestConfig";
import { SZEWTwinRealityData } from "../../RealityData";

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

chai.config.showDiff = true;

chai.should();
chai.use(chaiAsPromised);

const LOG_CATEGORY: string = "RealityDataClient.Test";

Logger.initializeToConsole();
Logger.setLevel(LOG_CATEGORY, LogLevel.Info);

const realityDataClientConfig: RealityDataClientOptions = {
  version: ApiVersion.v1,
  baseUrl: "https://api.szewec.com/reality-management/reality-data",
};

const realityDataAccessClientForTest = new RealityDataAccessClient(
  realityDataClientConfig,
);

describe("RealityServicesClient Normal (#integration)", () => {
  const szewTwinId: GuidString = TestConfig.integrationTestsSZEWTwinId;
  const szewTwinId2: GuidString = TestConfig.integrationTestsSZEWTwinIdProjects;

  const realityDataAccessClient = new RealityDataAccessClient();

  let realityDataId: string;
  let realityDataIdProjects: string;

  // test RealityData for listing tests.
  const realityDataList: SZEWTwinRealityData[] = [];

  let accessToken: AccessToken;

  before(async () => {
    // get token
    accessToken = await TestConfig.getAccessToken();

    chai.assert.isDefined(szewTwinId);
    chai.assert.isDefined(szewTwinId2);

    // create a test reality data
    let rdTest = new SZEWTwinRealityData(
      realityDataAccessClient,
      {
        displayName: "szewTwinjs reality-data-client test, can be deleted",
        type: "3MX",
      },
      szewTwinId,
    );
    rdTest = await realityDataAccessClient.createRealityData(
      accessToken,
      szewTwinId,
      rdTest,
    );
    chai.assert(rdTest, "Failed to create test reality data");
    realityDataId = rdTest.id;

    // create a test reality data associated to both szewTwins
    let rdTestProjects = new SZEWTwinRealityData(
      realityDataAccessClient,
      {
        displayName: "szewTwinjs reality-data-client projects, can be deleted",
        type: "3MX",
      },
      szewTwinId,
    );
    rdTestProjects = await realityDataAccessClient.createRealityData(
      accessToken,
      szewTwinId,
      rdTestProjects,
    );
    await realityDataAccessClient.associateRealityData(
      accessToken,
      szewTwinId2,
      rdTestProjects.id,
    );
    chai.assert(rdTestProjects, "Failed to create test reality data");

    // create 10 reality data for listing tests
    for (let i = 0; i < 10; i++) {
      let rd = new SZEWTwinRealityData(
        realityDataAccessClient,
        {
          displayName: `szewTwinjs reality-data-client listing test ${i}, can be deleted`,
          type: "3MX",
        },
        szewTwinId,
      );
      rd = await realityDataAccessClient.createRealityData(
        accessToken,
        szewTwinId,
        rd,
      );
      chai.assert(rd, `Failed to create test reality data ${i}`);
      realityDataList.push(rd);
    }

    realityDataIdProjects = rdTestProjects.id;
  });

  after(async () => {
    // delete the test reality data
    const deleteResult1 = await realityDataAccessClient.deleteRealityData(
      accessToken,
      realityDataId,
    );
    chai.assert(deleteResult1, "Failed to delete test reality data");

    const dissociateResult =
      await realityDataAccessClient.dissociateRealityData(
        accessToken,
        szewTwinId2,
        realityDataIdProjects,
      );
    chai.assert(dissociateResult, "Failed to dissociate test reality data");
    const deleteResult2 = await realityDataAccessClient.deleteRealityData(
      accessToken,
      realityDataIdProjects,
    );
    chai.assert(deleteResult2, "Failed to delete test reality data");

    // delete the test reality data for listing tests
    for (let i = 0; i < 10; i++) {
      const deleteResult = await realityDataAccessClient.deleteRealityData(
        accessToken,
        realityDataList[i].id,
      );
      chai.assert(deleteResult, `Failed to delete test reality data ${i}`);
    }
  });

  it("should properly redirect configured URL to proper Reality Management API URL", async () => {
    // dev
    const realityDataClientConfigDev: RealityDataClientOptions = {
      version: ApiVersion.v1,
      baseUrl: "https://dev-api.szewec.com/realitydata",
    };

    const realityDataAccessClientDev = new RealityDataAccessClient(
      realityDataClientConfigDev,
    );
    chai.assert(
      realityDataAccessClientDev.baseUrl ===
        "https://dev-api.szewec.com/reality-management/reality-data",
    );

    // qa
    const realityDataClientConfigQa: RealityDataClientOptions = {
      version: ApiVersion.v1,
      baseUrl: "https://qa-api.szewec.com/www.someotherfakehost.com/",
    };

    const realityDataAccessClientQa = new RealityDataAccessClient(
      realityDataClientConfigQa,
    );
    chai.assert(
      realityDataAccessClientQa.baseUrl ===
        "https://qa-api.szewec.com/reality-management/reality-data",
    );

    // prod
    const realityDataClientConfigProd: RealityDataClientOptions = {
      version: ApiVersion.v1,
      baseUrl: "https://api.szewec.com/realitydata",
    };

    const realityDataAccessClientProd = new RealityDataAccessClient(
      realityDataClientConfigProd,
    );
    chai.assert(
      realityDataAccessClientProd.baseUrl ===
        "https://api.szewec.com/reality-management/reality-data",
    );

    // error test
    const realityDataClientConfigError: RealityDataClientOptions = {
      version: ApiVersion.v1,
      baseUrl: "https://evilwebsite.net",
    };

    try {
      const _realityDataAccessClientError = new RealityDataAccessClient(
        realityDataClientConfigError,
      );
    } catch (errorResponse: any) {
      chai.assert(
        errorResponse.message === "invalid host",
        `Error message should be 'invalid host'. It is '${errorResponse.errorNumber}.`,
      );
      return;
    }
  });

  it("should return a RealityData URL properly from a given ID", async () => {
    try {
      // test with szewTwinId
      let realityDataUrl = await realityDataAccessClient.getRealityDataUrl(
        szewTwinId,
        realityDataId,
      );
      const expectedUrl = `${realityDataClientConfig.baseUrl}/${realityDataId}?szewTwinId=${szewTwinId}`;
      chai.assert(realityDataUrl === expectedUrl);

      // test without szewTwinId
      realityDataUrl = await realityDataAccessClient.getRealityDataUrl(
        undefined,
        realityDataId,
      );
      chai.assert(
        realityDataUrl ===
          `${realityDataClientConfig.baseUrl}/${realityDataId}`,
      );
    } catch (errorResponse: any) {
      throw Error(`Test error: ${errorResponse}`);
    }
  });

  it("should return a RealityData from a given ID", async () => {
    try {
      let realityData = await realityDataAccessClientForTest.getRealityData(
        accessToken,
        szewTwinId,
        realityDataId,
      );
      chai.assert(realityData);
      chai.assert(realityData.id === realityDataId);

      // test without szewTwinId
      await delay(1000);
      realityData = await realityDataAccessClientForTest.getRealityData(
        accessToken,
        undefined,
        realityDataId,
      );
      chai.assert(realityData);
      chai.assert(realityData.id === realityDataId);
    } catch (errorResponse: any) {
      throw Error(`Test error: ${errorResponse}`);
    }
  });

  it("should return a RealityData from a given ID and respect RealityDataAccessProps interfaces", async () => {
    try {
      const realityData: RealityData =
        await realityDataAccessClientForTest.getRealityData(
          accessToken,
          szewTwinId,
          realityDataId,
        );
      chai.assert(realityData);
      chai.assert(realityData.id === realityDataId);
    } catch (errorResponse: any) {
      throw Error(`Test error: ${errorResponse}`);
    }
  });

  // TODO: remove once getRealityDataProjects method is removed in next major release
  it("should be able to get project information from a RealityData", async () => {
    // displayName: szewTwinjs RealityData Client get projects test, id: d344d5dm-5068-4752-9432-ff1c8f087111
    const realityData = await realityDataAccessClientForTest.getRealityData(
      accessToken,
      szewTwinId,
      realityDataIdProjects,
    );

    chai.assert(realityData);
    // get all projects information
    /* eslint-disable @typescript-eslint/no-deprecated */
    const projects =
      await realityDataAccessClientForTest.getRealityDataProjects(
        accessToken,
        realityData.id,
      );
    /* eslint-enable @typescript-eslint/no-deprecated */
    chai.assert(projects);
    chai.assert(projects.length === 2);
    projects.forEach((value) => {
      chai.assert(value.id);
      chai.assert(value.projectDetailsLink);
    });
  });

  it("should be able to get szewTwin information from a RealityData", async () => {
    // displayName: szewTwinjs RealityData Client get projects test, id: d344d5dm-5068-4752-9432-ff1c8f087111
    const realityData = await realityDataAccessClientForTest.getRealityData(
      accessToken,
      szewTwinId,
      realityDataIdProjects,
    );

    chai.assert(realityData);
    // get all projects information
    const projects = await realityDataAccessClientForTest.getRealityDataSZEWTwins(
      accessToken,
      realityData.id,
    );
    chai.assert(projects);
    chai.assert(projects.length === 2);
    projects.forEach((value) => {
      chai.assert(value);
    });
  });

  it("should be able to retrieve the azure blob url", async () => {
    const realityData = await realityDataAccessClientForTest.getRealityData(
      accessToken,
      szewTwinId,
      realityDataId,
    );
    const url: URL = await realityData.getBlobUrl(accessToken, "test");
    chai.assert(url);
    chai.assert(url.toString().includes("test"));

    // cache test, wait 1 second and make the same call again, url should be the same.
    await delay(1000);
    const fakeAccessToken = "fake"; // this ensures that we are not executing a request to the API for a new SAS url, otherwise it would fail
    const url2: URL = await realityData.getBlobUrl(fakeAccessToken, "test");
    chai.assert(url.href === url2.href);

    // cache test, wait 1 second and request the same reality data with WRITE access, url should be different.
    await delay(1000);
    const url2Write: URL = await realityData.getBlobUrl(
      accessToken,
      "test",
      true,
    );
    chai.assert(url2.href !== url2Write.href);

    // test without szewTwinId
    await delay(1000);

    const realityData2 = await realityDataAccessClientForTest.getRealityData(
      accessToken,
      undefined,
      realityDataId,
    );
    const url3: URL = await realityData2.getBlobUrl(accessToken, "test");
    chai.assert(url3);
    chai.assert(url3.toString().includes("test"));
  });

  it("should be able to retrieve reality data properties for every reality data associated with szewTwin", async () => {
    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        undefined,
      );
    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(realityDatas);

    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.type);
      chai.assert(value.id);
    });
  });

  it("should be able to retrieve reality data properties for every available realitydata", async () => {
    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        undefined,
        undefined,
      );
    const realityDatas = realityDataResponse.realityDatas;

    chai.assert(realityDatas);

    realityDatas.forEach((value) => {
      chai.assert(value.id);
      chai.assert(value.type);
      chai.assert(value.displayName);
    });
  });

  it("should query the first 10 reality data using the $top=10 parameter", async () => {
    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      top: 10,
    };

    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );
    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(realityDatas);

    chai.assert(realityDatas.length === 10);
    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.type);
      chai.assert(value.id);
    });

    // max results > 500 should fail.
    const badRealityDataQueryCriteria: RealityDataQueryCriteria = {
      top: 501,
    };
    await chai
      .expect(
        realityDataAccessClientForTest.getRealityDatas(
          accessToken,
          szewTwinId,
          badRealityDataQueryCriteria,
        ),
      )
      .to.eventually.be.rejectedWith(Error);
  });

  it("should be able to query using continuationToken", async () => {
    // get the first 5
    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      top: 5,
    };

    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );

    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(realityDatas);

    chai.assert(realityDatas.length === 5);
    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.type);
      chai.assert(value.id);
    });

    chai.assert(realityDataResponse.continuationToken);

    // get another 5 with continuation token
    const realityDataQueryCriteriaContinuationToken: RealityDataQueryCriteria =
      {
        top: 5,
        continuationToken: realityDataResponse.continuationToken,
      };

    const realityDataResponseContinuation =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteriaContinuationToken,
      );

    const realityDatasContinued = realityDataResponseContinuation.realityDatas;
    chai.assert(realityDatasContinued);

    chai.assert(realityDatasContinued.length === 5);
    realityDatasContinued.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.type);
      chai.assert(value.id);
    });

    // test until no more continuation
    const realityDataQueryUntilTheEnd: RealityDataQueryCriteria = {
      top: 5,
      continuationToken: realityDataResponseContinuation.continuationToken,
    };

    while (realityDataQueryUntilTheEnd.continuationToken) {
      const realityDataResponseUntilTheEnd =
        await realityDataAccessClientForTest.getRealityDatas(
          accessToken,
          szewTwinId,
          realityDataQueryUntilTheEnd,
        );
      realityDataQueryUntilTheEnd.continuationToken =
        realityDataResponseUntilTheEnd.continuationToken;
    }
  });

  it("should query reality data using the $orderby parameter", async () => {
    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      getFullRepresentation: true,
      top: 10,
      orderBy: "createdDateTime desc",
    };

    const realityDataResponse = await realityDataAccessClient.getRealityDatas(
      accessToken,
      szewTwinId,
      realityDataQueryCriteria,
    );

    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(realityDatas);
    chai.assert(
      realityDatas.length > 1,
      "Expected at least two reality data results",
    );

    let lastCreatedTime = Number.MAX_SAFE_INTEGER;

    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.type);
      chai.assert(value.id);
      chai.assert(value?.createdDateTime);
      chai.assert(value.createdDateTime.getTime() <= lastCreatedTime);
      lastCreatedTime = value.createdDateTime.getTime();
    });
  });

  it("should query reality data using the $search parameter with the search term: This is a fairly simple description.", async () => {
    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      getFullRepresentation: true,
      top: 10,
      search: "This is a fairly simple description.",
    };

    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );

    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(
      realityDatas && realityDatas.length > 0,
      "No reality data found. Please verify test reality data exists with description 'This is a fairly simple description.'.",
    );

    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.type);
      chai.assert(value.id);
      chai.assert(
        value.description?.includes("This is a fairly simple description."),
      );
    });
  });

  it("should query reality data using the types parameter", async () => {
    const types = ["3MX", "3SM"];
    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      top: 10,
      types,
    };

    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );

    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(
      realityDatas && realityDatas.length > 0,
      "No reality data found. Please verify test reality data exists with types 3MX and 3SM.",
    );

    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.type);
      chai.assert(value.id);
      chai.assert(value.type === "3MX" || value.type === "3SM");
    });
  });

  it("should query reality data using the acquisitionDateTime parameter", async () => {
    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      getFullRepresentation: true,
      top: 10,
      acquisitionDates: {
        startDateTime: new Date(2017, 5, 12),
        endDateTime: new Date(2023, 5, 12),
      },
    };

    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );

    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(
      realityDatas && realityDatas.length > 0,
      "No reality data found. Please verify test reality data exists with acquisition dates between 2017-05-12 and 2023-05-12.",
    );

    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.type);
      chai.assert(value.id);
      chai.assert(value.acquisition);
      chai.assert(value.acquisition?.startDateTime);
      chai.assert(
        value.acquisition?.startDateTime.getTime() >=
          new Date(2017, 5, 12).getTime(),
      );
      chai.assert(
        value.acquisition?.startDateTime.getTime() <=
          new Date(2023, 5, 12).getTime(),
      );
    });
  });

  it("should query reality data using the createdDateTime parameter", async () => {
    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      getFullRepresentation: true,
      top: 10,
      createdDateTime: {
        startDateTime: new Date(2021, 5, 12),
        endDateTime: new Date(2022, 5, 12),
      },
    };

    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );

    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(
      realityDatas && realityDatas.length > 0,
      "No reality data found. Please verify test reality data exists with creation dates between 2021-05-12 and 2022-05-12.",
    );

    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.type);
      chai.assert(value.id);
      chai.assert(value.createdDateTime);
      chai.assert(
        value.createdDateTime.getTime() >= new Date(2021, 5, 12).getTime(),
      );
      chai.assert(
        value.createdDateTime.getTime() <= new Date(2022, 5, 12).getTime(),
      );
    });
  });

  it("should query reality data using the modifiedDateTime parameter", async () => {
    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      getFullRepresentation: true,
      top: 10,
      modifiedDateTime: {
        startDateTime: new Date(2021, 0, 1),
        endDateTime: new Date(2030, 0, 1),
      },
    };

    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );

    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(
      realityDatas && realityDatas.length > 0,
      "No reality data found. Please verify test reality data exists with modification dates between 2021-01-01 and 2030-01-01.",
    );

    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.type);
      chai.assert(value.id);
      chai.assert(value.modifiedDateTime);
      chai.assert(
        value.modifiedDateTime.getTime() >= new Date(2021, 0, 1).getTime(),
      );
      chai.assert(
        value.modifiedDateTime.getTime() <= new Date(2030, 0, 1).getTime(),
      );
    });
  });

  it("should query reality data using the lastAccessedDateTime parameter", async () => {
    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      getFullRepresentation: true,
      top: 10,
      lastAccessedDateTime: {
        startDateTime: new Date(2021, 0, 1),
        endDateTime: new Date(2030, 0, 1),
      },
    };

    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );

    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(
      realityDatas && realityDatas.length > 0,
      "No reality data found. Please verify test reality data exists with last accessed dates between 2021-01-01 and 2030-01-01.",
    );

    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.type);
      chai.assert(value.id);
      chai.assert(value.lastAccessedDateTime);
      chai.assert(
        value.lastAccessedDateTime.getTime() >= new Date(2021, 0, 1).getTime(),
      );
      chai.assert(
        value.lastAccessedDateTime.getTime() <= new Date(2030, 0, 1).getTime(),
      );
    });
  });

  it("should query reality data using the ownerId parameter", async () => {
    // Fetch one reality data to get its ownerId, then query by that ownerId
    const referenceRd = await realityDataAccessClientForTest.getRealityData(
      accessToken,
      szewTwinId,
      realityDataId,
    );
    chai.assert(
      referenceRd.ownerId,
      "ownerId must be populated on a fetched reality data",
    );

    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      getFullRepresentation: true,
      top: 10,
      ownerId: referenceRd.ownerId,
    };

    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );

    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(
      realityDatas && realityDatas.length > 0,
      "No reality data found when filtering by ownerId.",
    );

    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.id);
      chai.assert(value.type);
      chai.assert(value.ownerId === referenceRd.ownerId);
    });
  });

  it("should query reality data using the dataCenter parameter", async () => {
    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      getFullRepresentation: true,
      top: 10,
      dataCenter: "East US",
    };

    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );

    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(
      realityDatas && realityDatas.length > 0,
      "No reality data found in 'East US' data center. Please verify test reality data exists in that data center.",
    );

    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.id);
      chai.assert(value.type);
      chai.assert(value.dataCenterLocation === "East US");
    });
  });

  it("should query reality data using the tag parameter", async () => {
    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      getFullRepresentation: true,
      top: 10,
      tag: "tag1",
    };

    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );

    const realityDatas = realityDataResponse.realityDatas;
    chai.assert(
      realityDatas && realityDatas.length > 0,
      "No reality data found. Please verify test reality data exists with tag 'tag1'.",
    );

    realityDatas.forEach((value) => {
      chai.assert(value.szewTwinId === szewTwinId);
      chai.assert(value.type);
      chai.assert(value.id);
      chai.assert(value.tags);
      chai.assert(value.tags.includes("tag1"));
    });
  });

  it("should be able to retrieve reality data properties for every reality data associated with szewTwin within an extent", async () => {
    // arrange
    let rdWithExtent = new SZEWTwinRealityData(
      realityDataAccessClientForTest,
      {
        displayName:
          "szewTwinjs reality-data-client test with extent, can be deleted",
        type: "3SM",
        extent: {
          southWest: { latitude: 40.6706, longitude: -80.3455 },
          northEast: { latitude: 40.6716, longitude: -80.3359 },
        },
      },
      szewTwinId,
    );
    rdWithExtent = await realityDataAccessClientForTest.createRealityData(
      accessToken,
      szewTwinId,
      rdWithExtent,
    );
    chai.assert(rdWithExtent, "Failed to create test reality data");
    const rdWithExtentId = rdWithExtent.id;

    // act
    const cornerSpatial = new Array<Point3d>();
    cornerSpatial.push(new Point3d(813907, -4775048, 4135438));
    cornerSpatial.push(new Point3d(814123, -4776318, 4135438));
    cornerSpatial.push(new Point3d(812222, -4776642, 4135438));
    cornerSpatial.push(new Point3d(812007, -4775372, 4135438));

    const rdRange = Range3d.createArray(cornerSpatial);
    const rdCartographicRange = new CartographicRange(
      rdRange,
      Transform.createIdentity(),
    );

    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      top: 10,
      extent: rdCartographicRange,
    };
    const realityDataResponse =
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );

    // assert
    chai.assert(realityDataResponse);
    chai.assert(
      realityDataResponse.realityDatas.length > 0,
      "No reality data found. Please verify test reality data exists within the given extent.",
    );
    chai.assert(
      realityDataResponse.realityDatas.filter((rd) => rd.id === rdWithExtentId)
        .length > 0,
    );

    // delete the test reality data
    const deleteResult = await realityDataAccessClientForTest.deleteRealityData(
      accessToken,
      rdWithExtentId,
    );
    chai.assert(deleteResult, "Failed to delete test reality data");
  });

  it("should be able to create, modify, then delete a Reality Data", async () => {
    // this test also serves as a property test.
    const realityData = new SZEWTwinRealityData(realityDataAccessClientForTest);
    realityData.displayName =
      "szewTwinjs RealityData Client create and delete test";
    realityData.dataset = "Test Dataset for szewTwinjs";
    realityData.group = "Test group";
    realityData.description = "Dummy description for a test reality data";
    realityData.attribution = "Attribution text";
    realityData.termsOfUse = "Terms of use text";
    realityData.rootDocument = "RootDocumentFile.txt";
    realityData.classification = "Undefined";
    realityData.type = "LAS";
    realityData.acquisition = {
      startDateTime: new Date("2019-05-10T09:46:16Z"),
      endDateTime: new Date("2019-05-10T09:46:16Z"),
      acquirer: "John Doe Surveying using Leico model 123A Point Cloud Scanner",
    };
    realityData.extent = {
      southWest: {
        latitude: 1.0,
        longitude: 2.0,
      },
      northEast: {
        latitude: 1.1,
        longitude: 2.1,
      },
    };
    realityData.crs = {
      id: "EPSG:4326",
      verticalId: "EPSG:5773",
    };
    realityData.tags = ["tag1", "tag2"];
    realityData.authoring = false;

    const realityDataAdded =
      await realityDataAccessClientForTest.createRealityData(
        accessToken,
        szewTwinId,
        realityData,
      );
    chai.assert(realityDataAdded.id);
    chai.assert(realityDataAdded.displayName === realityData.displayName);
    chai.assert(realityDataAdded.group === realityData.group);
    chai.assert(realityDataAdded.dataset === realityData.dataset);
    chai.assert(realityDataAdded.description === realityData.description);
    chai.assert(realityDataAdded.attribution === realityData.attribution);
    chai.assert(realityDataAdded.termsOfUse === realityData.termsOfUse);
    chai.assert(realityDataAdded.rootDocument === realityData.rootDocument);
    chai.assert(realityDataAdded.classification === realityData.classification);
    chai.assert(
      realityDataAdded.type?.toLowerCase() === realityData.type.toLowerCase(),
    );

    chai.assert(
      realityDataAdded.acquisition?.acquirer ===
        realityData.acquisition.acquirer,
    );
    chai.assert(
      realityDataAdded.acquisition?.startDateTime.getTime() ===
        realityData.acquisition.startDateTime.getTime(),
    );
    chai.assert(realityData.acquisition?.endDateTime);
    chai.assert(realityDataAdded.acquisition?.endDateTime);
    chai.assert(
      realityDataAdded.acquisition.endDateTime.getTime() ===
        realityData.acquisition.endDateTime.getTime(),
    );
    chai.assert(realityDataAdded.extent);
    chai.assert(realityDataAdded.extent.southWest.latitude === 1.0);
    chai.assert(realityDataAdded.extent.southWest.longitude === 2.0);
    chai.assert(realityDataAdded.extent.northEast.latitude === 1.1);
    chai.assert(realityDataAdded.extent.northEast.longitude === 2.1);
    chai.assert(realityDataAdded.crs);
    chai.assert(realityDataAdded.crs.id === "EPSG:4326");
    chai.assert(realityDataAdded.crs.verticalId === "EPSG:5773");

    chai.assert(realityDataAdded.tags);
    chai.assert(realityDataAdded.tags.includes("tag1"));
    chai.assert(realityDataAdded.tags.includes("tag2"));
    chai.assert(realityDataAdded.authoring === false);
    chai.assert(realityDataAdded.dataCenterLocation === "East US");
    chai.assert(realityDataAdded.modifiedDateTime);
    chai.assert(realityDataAdded.modifiedDateTime.getTime());
    chai.assert(realityDataAdded.lastAccessedDateTime);
    chai.assert(realityDataAdded.lastAccessedDateTime.getTime());
    chai.assert(realityDataAdded.createdDateTime);
    chai.assert(realityDataAdded.createdDateTime.getTime());
    chai.assert(realityDataAdded.ownerId);

    realityDataAdded.displayName =
      "MODIFIED szewTwinjs RealityData Client create and delete test";
    realityDataAdded.group = "MODIFIED Test group";
    realityDataAdded.dataset = "MODIFIED Test Dataset for szewTwinjs";
    realityDataAdded.description =
      "MODIFIED Dummy description for a test reality data";
    realityDataAdded.rootDocument = "MODIFIED RootDocumentFile.txt";
    realityDataAdded.classification = "Model";
    realityDataAdded.type = "LAZ";
    realityDataAdded.acquisition = {
      startDateTime: new Date("2021-05-10T09:46:16Z"),
      endDateTime: new Date("2021-05-10T10:46:16Z"),
      acquirer:
        "MODIFIED John Doe Surveying using Leico model 123A Point Cloud Scanner",
    };
    realityDataAdded.extent = {
      southWest: { latitude: 1.1, longitude: 2.0 },
      northEast: { latitude: 1.2, longitude: 2.1 },
    };
    realityDataAdded.tags = ["tag1", "tag2", "tag3"];
    realityDataAdded.crs = {
      id: "EPSG:3857",
      verticalId: "EPSG:5703",
    };
    realityDataAdded.attribution = "MODIFIED Attribution text";
    realityDataAdded.termsOfUse = "MODIFIED Terms of use text";

    const realityDataModified =
      await realityDataAccessClientForTest.modifyRealityData(
        accessToken,
        szewTwinId,
        realityDataAdded,
      );

    chai.assert(
      realityDataModified.displayName === realityDataAdded.displayName,
    );
    chai.assert(realityDataModified.group === realityDataAdded.group);
    chai.assert(realityDataModified.dataset === realityDataAdded.dataset);
    chai.assert(
      realityDataModified.description === realityDataAdded.description,
    );
    chai.assert(
      realityDataModified.rootDocument === realityDataAdded.rootDocument,
    );
    chai.assert(
      realityDataModified.classification === realityDataAdded.classification,
    );
    chai.assert(
      realityDataModified.type?.toLowerCase() ===
        realityDataAdded.type.toLowerCase(),
    );
    chai.assert(
      realityDataModified.acquisition?.acquirer ===
        realityDataAdded.acquisition.acquirer,
    );
    chai.assert(
      realityDataModified.acquisition?.startDateTime.getTime() ===
        realityDataAdded.acquisition.startDateTime.getTime(),
    );
    chai.assert(realityDataModified.acquisition?.endDateTime);
    chai.assert(realityDataAdded.acquisition?.endDateTime);
    chai.assert(
      realityDataModified.acquisition.endDateTime.getTime() ===
        realityDataAdded.acquisition.endDateTime.getTime(),
    );
    chai.assert(realityDataModified.extent);
    chai.assert(realityDataModified.extent.southWest.latitude === 1.1);
    chai.assert(realityDataModified.extent.southWest.longitude === 2.0);
    chai.assert(realityDataModified.extent.northEast.latitude === 1.2);
    chai.assert(realityDataModified.extent.northEast.longitude === 2.1);
    chai.assert(realityDataModified.crs);
    chai.assert(realityDataModified.crs.id === realityDataAdded.crs.id);
    chai.assert(
      realityDataModified.crs.verticalId === realityDataAdded.crs.verticalId,
    );
    chai.assert(
      realityDataModified.attribution === realityDataAdded.attribution,
    );
    chai.assert(realityDataModified.termsOfUse === realityDataAdded.termsOfUse);
    chai.assert(realityDataModified.tags);
    chai.assert(realityDataModified.tags.includes("tag1"));
    chai.assert(realityDataModified.tags.includes("tag2"));
    chai.assert(realityDataModified.tags.includes("tag3"));

    chai.assert(
      await realityDataAccessClientForTest.deleteRealityData(
        accessToken,
        realityDataAdded.id,
      ),
    );
  });

  it("should be able to create, associate, dissociate, and delete RealityData", async () => {
    const realityData = new SZEWTwinRealityData(realityDataAccessClientForTest);
    realityData.displayName =
      "szewTwinjs RealityData Client associate and dissociate test";
    realityData.classification = "Undefined";
    realityData.type = "3MX";

    const realityDataAdded =
      await realityDataAccessClientForTest.createRealityData(
        accessToken,
        szewTwinId,
        realityData,
      );

    chai.assert(
      await realityDataAccessClientForTest.associateRealityData(
        accessToken,
        szewTwinId2,
        realityDataAdded.id,
      ),
    );

    chai.assert(
      await realityDataAccessClientForTest.dissociateRealityData(
        accessToken,
        szewTwinId2,
        realityDataAdded.id,
      ),
    );

    chai.assert(
      await realityDataAccessClientForTest.deleteRealityData(
        accessToken,
        realityDataAdded.id,
      ),
    );
  });

  it("should be able to create modify, and delete Reality Data, (Without szewTwinId)", async () => {
    const realityData = new SZEWTwinRealityData(realityDataAccessClientForTest);
    realityData.displayName =
      "szewTwinjs RealityData Client CRUD test without szewTwinId";
    realityData.classification = "Undefined";
    realityData.type = "3MX";

    // current test user belongs to no organization and needs a szewTwin to create realityData. However, the modify without szewTwinId can be tested.
    const realityDataAdded =
      await realityDataAccessClientForTest.createRealityData(
        accessToken,
        szewTwinId,
        realityData,
      );

    realityDataAdded.displayName =
      "MODIFIED szewTwinjs RealityData Client CRUD test without szewTwinId";

    const realityDataModified =
      await realityDataAccessClientForTest.modifyRealityData(
        accessToken,
        undefined,
        realityDataAdded,
      );

    chai.assert(
      realityDataModified.displayName === realityDataAdded.displayName,
    );

    chai.assert(
      await realityDataAccessClientForTest.deleteRealityData(
        accessToken,
        realityDataAdded.id,
      ),
    );
  });

  it("should be able to move Reality Data", async () => {
    const realityData = new SZEWTwinRealityData(realityDataAccessClientForTest);
    realityData.displayName = "szewTwinjs RealityData Client move test";
    realityData.classification = "Undefined";
    realityData.type = "3MX";
    const realityDataAdded =
      await realityDataAccessClientForTest.createRealityData(
        accessToken,
        szewTwinId,
        realityData,
      );
    chai.assert(realityDataAdded.id);
    try {
      // move the reality data to another szewTwin
      const movedRealityData =
        await realityDataAccessClientForTest.moveRealityData(
          accessToken,
          realityDataAdded.id,
          szewTwinId2,
        );
      chai.assert(movedRealityData);

      // get szewtwins
      const szewtwins = await realityDataAccessClientForTest.getRealityDataSZEWTwins(
        accessToken,
        realityDataAdded.id,
      );
      chai.assert(szewtwins.length === 1);
      chai.assert(szewtwins[0] === szewTwinId2);
    } finally {
      // delete the moved reality data
      chai.assert(
        await realityDataAccessClientForTest.deleteRealityData(
          accessToken,
          realityDataAdded.id,
        ),
      );
    }
  });
});

describe("RealityServicesClient Errors (#integration)", () => {
  let szewTwinId: GuidString;

  const nonExistentRealityDataId: string =
    "f2065aea-5dcd-49e2-9077-000000000000";

  let accessToken: AccessToken;

  before(async () => {
    accessToken = await TestConfig.getAccessToken();
    szewTwinId = TestConfig.integrationTestsSZEWTwinId;
    chai.assert.isDefined(szewTwinId);
  });

  it("should throw a 422 error when Reality Data ID is not a valid Guid", async () => {
    const rdId = "f2065aea-5dcd-49e2-9077-xxxxxxxxxxxx";
    try {
      await realityDataAccessClientForTest.getRealityData(
        accessToken,
        szewTwinId,
        rdId,
      );
    } catch (errorResponse: any) {
      chai.assert(
        errorResponse.errorNumber === 422,
        `Error code should be 422. It is ${errorResponse.errorNumber}.`,
      );
      return;
    }
    chai.assert(false, "getRealityData should throw an error.");
  });

  it("should throw a 404 error when Reality Data ID does not exist.", async () => {
    try {
      await realityDataAccessClientForTest.getRealityData(
        accessToken,
        szewTwinId,
        nonExistentRealityDataId,
      );
    } catch (errorResponse: any) {
      chai.assert(
        errorResponse.errorNumber === 404,
        `Error code should be 404. It is ${errorResponse.errorNumber}.`,
      );
      return;
    }
    chai.assert(false, "getRealityData should throw an error.");
  });

  it("should throw a 422 error when the szewTwinId is invalid (getting all reality data in a szewTwin)", async () => {
    const invalidSZEWTwinId = "xxxxxxxx-cc9f-4de9-af87-f834002ca19e";
    try {
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        invalidSZEWTwinId,
        undefined,
      );
    } catch (errorResponse: any) {
      chai.assert(
        errorResponse.errorNumber === 422,
        `Error message should be 422. It is ${errorResponse.errorNumber}.`,
      );
      return;
    }
    chai.assert(false, "getRealityDatas should throw an error.");
  });

  it("should throw a 422 error when the top parameter is > 500 (getting all reality data in a szewTwin)", async () => {
    const realityDataQueryCriteria: RealityDataQueryCriteria = {
      top: 501,
    };

    try {
      await realityDataAccessClientForTest.getRealityDatas(
        accessToken,
        szewTwinId,
        realityDataQueryCriteria,
      );
    } catch (errorResponse: any) {
      chai.assert(
        errorResponse.errorNumber === 422,
        `Error code should be 422. It is ${errorResponse.errorNumber}.`,
      );
      return;
    }
    chai.assert(
      false,
      "getRealityDatas should throw an error when top parameter is > 500.",
    );
  });

  it("should throw a 422 error when required properties are missing (creating a reality data)", async () => {
    // displayName is missing
    const realityData = new SZEWTwinRealityData(realityDataAccessClientForTest);
    realityData.dataset = "Test Dataset for szewTwinjs";
    realityData.description = "Dummy description for a test reality data";
    realityData.type = "3MX";
    realityData.classification = "Undefined";
    try {
      await realityDataAccessClientForTest.createRealityData(
        accessToken,
        szewTwinId,
        realityData,
      );
    } catch (errorResponse: any) {
      chai.assert(
        errorResponse.errorNumber === 422,
        `Error code should be 422. It is ${errorResponse.errorNumber}.`,
      );
      return;
    }
    chai.assert(false, "createRealityData should throw an error.");
  });

  it("should throw a 404 error when reality data id does not exist (modifying a reality data)", async () => {
    const realityData = new SZEWTwinRealityData(realityDataAccessClientForTest);
    realityData.id = nonExistentRealityDataId;
    realityData.displayName = "MODIFIED szewTwinjs RealityData";
    realityData.dataset = "Test Dataset for szewTwinjs";
    realityData.description = "Dummy description for a test reality data";
    realityData.type = "3MX";
    realityData.classification = "Undefined";
    try {
      await realityDataAccessClientForTest.modifyRealityData(
        accessToken,
        szewTwinId,
        realityData,
      );
    } catch (errorResponse: any) {
      chai.assert(
        errorResponse.errorNumber === 404,
        `Error code should be 404. It is ${errorResponse.errorNumber}.`,
      );
      return;
    }
    chai.assert(false, "createRealityData should throw an error.");
  });

  it("should throw a 404 error when reality data id does not exist (deleting a reality data)", async () => {
    try {
      await realityDataAccessClientForTest.deleteRealityData(
        accessToken,
        nonExistentRealityDataId,
      );
    } catch (errorResponse: any) {
      chai.assert(
        errorResponse.errorNumber === 404,
        `Error code should be 404. It is ${errorResponse.errorNumber}.`,
      );
      return;
    }
    chai.assert(false, "deleteRealityData should throw an error.");
  });

  it("should throw a 404 error when reality data id does not exist (associate a reality data)", async () => {
    try {
      await realityDataAccessClientForTest.associateRealityData(
        accessToken,
        szewTwinId,
        nonExistentRealityDataId,
      );
    } catch (errorResponse: any) {
      chai.assert(
        errorResponse.errorNumber === 404,
        `Error code should be 404. It is ${errorResponse.errorNumber}.`,
      );
      return;
    }
    chai.assert(false, "associateRealityData should throw an error.");
  });

  it("should throw a 404 error when reality data id does not exist (dissociate a reality data)", async () => {
    try {
      await realityDataAccessClientForTest.dissociateRealityData(
        accessToken,
        szewTwinId,
        nonExistentRealityDataId,
      );
    } catch (errorResponse: any) {
      chai.assert(
        errorResponse.errorNumber === 404,
        `Error code should be 404. It is ${errorResponse.errorNumber}.`,
      );
      return;
    }
    chai.assert(false, "dissociateRealityData should throw an error.");
  });

  it("should throw a 404 error when reality data id does not exist (moving a reality data)", async () => {
    try {
      await realityDataAccessClientForTest.moveRealityData(
        accessToken,
        nonExistentRealityDataId,
        szewTwinId,
      );
    } catch (errorResponse: any) {
      chai.assert(
        errorResponse.errorNumber === 404,
        `Error code should be 404. It is ${errorResponse.errorNumber}.`,
      );
      return;
    }
    chai.assert(false, "moveRealityData should throw an error.");
  });
});
