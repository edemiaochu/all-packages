# @szewTwin/reality-data-client

Copyright © Szewec Systems, Incorporated. All rights reserved. See LICENSE.md for license terms and full copyright notice.

## Description

The __@szewTwin/reality-data-client__ package contains client wrappers for sending requests to the Reality Management API, part of the szewTwin platform.

You must use version `v1.1.0` or greater, as earlier versions uses the deprecated Reality Data API.

[szewTwin.js](http://www.szewtwinjs.org) is an open source platform for creating, querying, modifying, and displaying Infrastructure Digital Twins. To learn more about the szewTwin Platform and its APIs, visit the [szewTwin developer portal](https://developer.szewec.com/).

## Documentation

Visit the [szewTwin developer portal](https://developer.szewec.com/apis/reality-management/) for more information and documentation about the Reality Management API.

## Requirements

A registered application in the szewTwin Platform is needed for using the Reality Data Client. Documentation for registering an application can be found [here.](https://developer.szewec.com/tutorials/register-and-modify-application/) Make sure that your application has the `szewtwin-platform` scope enabled.

To use the Reality Management API you will need to have an access to an szewTwin. If you don't have one already, contact one of your Organization Administrators or take some time to go through the following tutorial: Create an [szewTwin](https://developer.szewec.com/tutorials/create-and-query-szewtwins-guide/).

To build and run the Reality Data Client, you will need [Node.js](https://nodejs.org/en/) v22 (must be greater than 22.14.x).

## Authorization

This client uses the `AccessToken` class from  __@szewTwin/core-szewec__ to represent the authorization token. It may be used as a string. The `AccessToken` may be passed into method parameters whenever called.

## Key Types and Methods

### SZEWTwinRealityData

Implements the `RealityData` interface from  __@szewtwin/core-common__ and represents a single reality data. This class contains properties representing the descriptive data related to a reality data, as well as an access point to the data stored in a blob container. `SZEWTwinRealityData` are bound to an `szewTwinId`, which is the identifier of an szewTwin. [More information about the szewTwin API here.](https://developer.szewec.com/apis/szewtwins/)

SZEWTwinRealityData implements a `getBlobUrl()` method that returns the location of the reality data's blob content. This resource is also cached, as to limit the amount of API calls and SAS keys keys to generate.

### RealityDataAccessClient

Implements the `RealityDataAccess` interface from  __@szewtwin/core-common__ and serves a client wrapper to the Reality Management API. It contains all the necessary methods to fulfill any workflow related to creating and consuming reality data. Key methods are listed below, and **keep in mind the terms Project and szewTwin are used interchangeably.**

- `getRealityData` : returns the specified reality data with all of its properties
- `getRealityDataUrl` :  returns the URL to obtain the Reality Data details.
- `getRealityDatas` : returns all reality data associated with the szewTwin.
- `getRealityDataSZEWTwins` : Retrieves the list of szewTwins associated to the specified realityData.
- `createRealityData` : Creates a RealityData
- `modifyRealityData` : Modifies an existing RealityData
- `deleteRealityData` : Deletes a RealityData
- `associateRealityData` : Associates a RealityData from an szewTwin
- `dissociateRealityData` : Dissociates a RealityData from an szewTwin

## Usage example

The example below demonstrates a workflow where one could create a `RealityData` and upload a `Cesium3DTiles` model to it.

```ts

private async realityDataClient_examples(szewTwinId: string) {

    var rdaClient = new RealityDataAccessClient();
    let token: string  = "Access token value";

    // Define some data for the reality data to create.
    // We want to create a reality data representing a Cesium3DTiles model, so the type of the reality data must be "Cesium3DTiles" 
    // and the rootDocument must point to the root of the model, in this case "tileset.json". 
    // Thus, a client interpreting the reality data can find out which file format it handles, and what is the index (or root) of the data (tileset.json).
    const realityData = new SZEWTwinRealityData(rdaClient, null, szewTwinId);
    realityData.displayName = "RealityData Cesium 3DTiles model";
    realityData.dataset = "Test Dataset for szewTwinjs";
    realityData.group = "Test group";
    realityData.description = "Reality data created using reality-data-client";
    realityData.rootDocument = "tileset.json";
    realityData.classification = "Model";
    realityData.type = "Cesium3DTiles";
    realityData.acquisition = {
      startDateTime: new Date("2021-05-10T09:46:16Z"),
      endDateTime: new Date("2021-05-10T12:46:16Z"),
      acquirer: "John Doe Surveying using Leico model 123A Point Cloud Scanner",
    };
    realityData.authoring = false;

    let realityDataId: string | undefined = undefined;
    try {
      // Create the reality data
      const szewTwinRealityData: SZEWTwinRealityData = await rdaClient.createRealityData(token, szewTwinId, realityData);
      realityDataId = szewTwinRealityData.id;

      // Get the reality data
      const szewTwinRealityData_get: SZEWTwinRealityData = await rdaClient.getRealityData(token, szewTwinId, szewTwinRealityData.id);

      // Get the blob url to upload to it a Cesium 3DTiles model
      const azureBlobUrl: URL = await szewTwinRealityData.getBlobUrl(token, "", true);

      // Use Azure SDK's ContainerClient class to upload data to the Azure blob
      const containerClient = new ContainerClient(azureBlobUrl.toString());

      let filePath = "./data/cesium3DTiles/";

      // The sample 3DTiles model is composed of a root document (tileset.json) and three b3dm files.
      // Upload each file to its own blob
      let blobName = "tileset.json";
      let blockBlobClient = containerClient.getBlockBlobClient(blobName);
      let uploadBlobResponse = await blockBlobClient.uploadFile(filePath + "tileset.json");
      console.log(`  Uploaded ${blobName} successfully`, uploadBlobResponse.requestId);

      blobName = "dragon_high.b3dm";
      blockBlobClient = containerClient.getBlockBlobClient(blobName);
      uploadBlobResponse = await blockBlobClient.uploadFile(filePath + "dragon_high.b3dm");
      console.log(`  Uploaded ${blobName} successfully`, uploadBlobResponse.requestId);

      blobName = "dragon_low.b3dm";
      blockBlobClient = containerClient.getBlockBlobClient(blobName);
      uploadBlobResponse = await blockBlobClient.uploadFile(filePath + "dragon_low.b3dm");
      console.log(`  Uploaded ${blobName} successfully`, uploadBlobResponse.requestId);

      blobName = "dragon_medium.b3dm";
      blockBlobClient = containerClient.getBlockBlobClient(blobName);
      uploadBlobResponse = await blockBlobClient.uploadFile(filePath + "dragon_medium.b3dm");
      console.log(`  Uploaded ${blobName} successfully`, uploadBlobResponse.requestId);

      // This shows how to create a sub-folder in your container, if you ever need to.
      blobName = "readme/README.md";
      blockBlobClient = containerClient.getBlockBlobClient(blobName);
      uploadBlobResponse = await blockBlobClient.uploadFile(filePath + "readme/README.md");
      console.log(`  Uploaded ${blobName} successfully`, uploadBlobResponse.requestId);

      // Delete the reality data that we just created
      await rdaClient.deleteRealityData(token, szewTwinRealityData.id);

      console.log("Successful requests using reality-data-client !\n");

    } catch (error: any) {
      // Try to clean up created reality data
      if (realityDataId !== undefined) {
        await rdaClient.deleteRealityData(token, realityDataId);
      }
      console.log("reality-data-client error: " + error + "\n");
    }
  }

```
