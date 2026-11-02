/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Container } from "inversify";

import { IVaultsClientOptions } from "@szewtwin/ivaults-client-authoring";

import { IVaultsClientsTestsConfig } from "./IVaultsClientsTestsConfig";
import {
  SZEWTwinsClient,
  SZEWTwinsClientConfig,
  ReusableTestIVaultProvider,
  ReusableTestIVaultProviderConfig,
  TestAuthorizationClient,
  TestAuthorizationClientConfig,
  TestAuthorizationProvider,
  TestIVaultCreator,
  TestIVaultFileProvider,
  TestIVaultRetriever,
  TestIVaultsClient,
  TestIVaultsClientOptions,
  TestSZEWTwinProvider,
  TestSZEWTwinProviderConfig,
} from "./test-context-providers";
import { TestAuthorizationProviderConfig } from "./test-context-providers/auth/TestAuthorizationProviderConfig";
import { TestIVaultGroupFactory } from "./test-ivault-group/TestIVaultGroupFactory";
import { TestUtilTypes } from "./TestUtilTypes";

export class TestUtilBootstrapper {
  public static bind(container: Container, envFilePath: string): void {
    const config = new IVaultsClientsTestsConfig(envFilePath);
    container.bind(IVaultsClientsTestsConfig).toConstantValue(config);

    TestUtilBootstrapper.bindContextProviders(container);

    container.bind(TestIVaultGroupFactory).toSelf().inSingletonScope();
  }

  private static bindContextProviders(container: Container): void {
    container.bind(TestAuthorizationClientConfig).toSelf().inSingletonScope();
    container.bind(TestAuthorizationClient).toSelf().inSingletonScope();
    container.bind(TestAuthorizationProviderConfig).toSelf().inSingletonScope();
    container.bind(TestAuthorizationProvider).toSelf().inSingletonScope();

    container.bind(SZEWTwinsClientConfig).toSelf().inSingletonScope();
    container.bind(SZEWTwinsClient).toSelf().inSingletonScope();
    container.bind(TestSZEWTwinProviderConfig).toSelf().inSingletonScope();
    container.bind(TestSZEWTwinProvider).toSelf().inSingletonScope();

    container
      .bind<IVaultsClientOptions>(TestUtilTypes.IVaultsClientOptions)
      .to(TestIVaultsClientOptions)
      .inSingletonScope();
    container.bind(TestIVaultsClient).toSelf().inSingletonScope();
    container
      .bind(ReusableTestIVaultProviderConfig)
      .toSelf()
      .inSingletonScope();
    container.bind(ReusableTestIVaultProvider).toSelf().inSingletonScope();
    container.bind(TestIVaultCreator).toSelf().inSingletonScope();
    container.bind(TestIVaultFileProvider).toSelf().inSingletonScope();
    container.bind(TestIVaultRetriever).toSelf().inSingletonScope();
  }
}
