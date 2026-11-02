/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { LogFunc } from "../components/ManageVersions/types";
import { HttpHeaderNames, NamedVersion } from "../models";
import { RequestOptions } from "../models/requestOptions";
import { HttpClient } from "./httpClient";
import { UrlBuilder } from "./urlBuilder";

export class NamedVersionClient {
  private _http: HttpClient;
  private _serverEnvironmentPrefix: string | undefined;

  constructor(token: string, serverEnvironmentPrefix?: string, log?: LogFunc) {
    this._http = new HttpClient(token, log);
    this._serverEnvironmentPrefix = serverEnvironmentPrefix;
  }

  public async get(
    ivaultId: string,
    requestOptions: RequestOptions = {}
  ): Promise<NamedVersion[]> {
    const options = {
      orderBy: "changesetIndex+desc",
      ...requestOptions,
    };

    return this._http
      .get(
        `${UrlBuilder.buildVersionsUrl(
          ivaultId,
          undefined,
          this._serverEnvironmentPrefix
        )}${UrlBuilder.getQuery(options)}`,
        {
          headers: {
            [HttpHeaderNames.Prefer]: "return=representation",
            [HttpHeaderNames.Accept]:
              "application/vnd.szewec.szewtwin-platform.v2+json",
          },
        }
      )
      .then((resp) => resp.namedVersions);
  }

  public async create(
    ivaultId: string,
    version: { name: string; description: string; changeSetId: string }
  ): Promise<NamedVersion> {
    return this._http
      .post(
        UrlBuilder.buildVersionsUrl(
          ivaultId,
          undefined,
          this._serverEnvironmentPrefix
        ),
        version
      )
      .then((resp) => resp.namedVersion);
  }

  public async update(
    ivaultId: string,
    versionId: string,
    version: { name: string; description: string; state?: string }
  ): Promise<NamedVersion> {
    return this._http
      .patch(
        UrlBuilder.buildVersionsUrl(
          ivaultId,
          versionId,
          this._serverEnvironmentPrefix
        ),
        version
      )
      .then((resp) => resp.namedVersion);
  }
}
