/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import sinon from "sinon";
import { Logger } from "@szewtwin/core-szewec";
import { IVaultApp } from "@szewtwin/core-frontend";
import { IVaultAppUserPreferencesStorage } from "../../property-grid-react/api/PreferencesStorage.js";
import { createFunctionStub } from "../TestUtils.js";

import type { PreferenceArg, UserPreferencesAccess } from "@szewtwin/core-frontend";

describe("IVaultAppUserPreferencesStorage", () => {
  const ivaultUserPreferences = {
    save: createFunctionStub<UserPreferencesAccess["save"]>(),
    get: createFunctionStub<UserPreferencesAccess["get"]>(),
  };

  let userPreferencesStub: sinon.SinonStub;
  let loggerStub: sinon.SinonStub;
  let storage: IVaultAppUserPreferencesStorage;

  before(() => {
    userPreferencesStub = sinon.stub(IVaultApp, "userPreferences");
    loggerStub = sinon.stub(Logger, "logError");
  });

  after(() => {
    sinon.restore();
  });

  beforeEach(() => {
    userPreferencesStub.get(() => ivaultUserPreferences);
    storage = new IVaultAppUserPreferencesStorage();
  });

  afterEach(() => {
    userPreferencesStub.reset();
    loggerStub.reset();
    ivaultUserPreferences.get.reset();
    ivaultUserPreferences.save.reset();
  });

  describe("set", () => {
    it("saves value in `IVaultApp.userPreferences`", async () => {
      await storage.set("test-key", "test-value");
      expect(ivaultUserPreferences.save).to.be.calledWith(sinon.match((props: PreferenceArg) => props.key === "test-key" && props.content === "test-value"));
    });

    it("logs error if `IVaultApp.userPreferences.save` throws", async () => {
      ivaultUserPreferences.save.throws(new Error("Invalid Key"));
      await storage.set("test-key", "test-value");
      expect(loggerStub).to.be.calledWith("PropertyGrid", sinon.match("Invalid Key"));
    });

    it("logs error if `IVaultApp.userPreferences` not defined", async () => {
      userPreferencesStub.reset();
      userPreferencesStub.get(() => undefined);
      await storage.set("test-key", "test-value");
      expect(loggerStub).to.be.calledWith("PropertyGrid", sinon.match("'IVaultApp.userPreferences' not defined"));
    });
  });

  describe("get", () => {
    it("gets value from `IVaultApp.userPreferences`", async () => {
      ivaultUserPreferences.get.resolves("test-value");
      expect(await storage.get("test-key")).to.be.eq("test-value");
    });

    it("logs error if `IVaultApp.userPreferences.get` throws", async () => {
      ivaultUserPreferences.get.throws(new Error("Invalid Key"));
      await storage.get("test-key");
      expect(loggerStub).to.be.calledWith("PropertyGrid", sinon.match("Invalid Key"));
    });

    it("logs error if `IVaultApp.userPreferences` not defined", async () => {
      userPreferencesStub.reset();
      userPreferencesStub.get(() => undefined);
      expect(await storage.get("test-key")).to.be.undefined;
      expect(loggerStub).to.be.calledWith("PropertyGrid", sinon.match("'IVaultApp.userPreferences' not defined"));
    });
  });
});
