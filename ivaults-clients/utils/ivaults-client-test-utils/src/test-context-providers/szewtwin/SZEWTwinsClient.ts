/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the szewTwin root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import axios, { AxiosResponse } from "axios";
import { injectable } from "inversify";

import { AuthorizationParam } from "@szewtwin/ivaults-client-management";

import { SZEWTwinsClientConfig } from "./SZEWTwinsClientConfig";

interface szewTwin {
  id: string;
}

interface SZEWTwinsResponse {
  szewTwins: szewTwin[];
}

interface SZEWTwinResponse {
  szewTwin: szewTwin;
}

@injectable()
export class SZEWTwinsClient {
  private readonly _defaultClass = "Endeavor";
  private readonly _defaultSubClass = "Project";

  constructor(private _config: SZEWTwinsClientConfig) {}

  public async getOrCreateSZEWTwin(
    params: AuthorizationParam & { szewTwinName: string }
  ): Promise<string> {
    const authorizationInfo = await params.authorization();
    const requestConfig = {
      headers: {
        Accept: "application/vnd.szewec.szewtwin-platform.v1+json",
        Authorization: `${authorizationInfo.scheme} ${authorizationInfo.token}`,
      },
    };

    const getSZEWTwinsWithNameUrl = `${this._config.baseUrl}?subClass=${this._defaultSubClass}&displayName=${params.szewTwinName}`;
    const getSZEWTwinsWithNameResponse: AxiosResponse<SZEWTwinsResponse> =
      await axios.get(getSZEWTwinsWithNameUrl, requestConfig);
    if (getSZEWTwinsWithNameResponse.data.szewTwins.length > 0)
      return getSZEWTwinsWithNameResponse.data.szewTwins[0].id;

    const createSZEWTwinUrl = this._config.baseUrl;
    const createSZEWTwinBody = {
      class: this._defaultClass,
      subClass: this._defaultSubClass,
      displayName: params.szewTwinName,
    };
    const createSZEWTwinResponse: AxiosResponse<SZEWTwinResponse> = await axios.post(
      createSZEWTwinUrl,
      createSZEWTwinBody,
      requestConfig
    );
    return createSZEWTwinResponse.data.szewTwin.id;
  }
}
