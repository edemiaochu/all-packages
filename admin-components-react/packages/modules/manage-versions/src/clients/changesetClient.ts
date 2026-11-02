/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { LogFunc } from "../components/ManageVersions/types";
import { Changeset, Checkpoint, HttpHeaderNames, User } from "../models";
import { RequestOptions } from "../models/requestOptions";
import { HttpClient } from "./httpClient";
import { UrlBuilder } from "./urlBuilder";

export class ChangesetClient {
  private _http: HttpClient;
  private _serverEnvironmentPrefix: string | undefined;

  constructor(token: string, serverEnvironmentPrefix?: string, log?: LogFunc) {
    this._http = new HttpClient(token, log);
    this._serverEnvironmentPrefix = serverEnvironmentPrefix;
  }

  public async get(
    ivaultId: string,
    requestOptions: RequestOptions = {}
  ): Promise<Changeset[]> {
    const options = {
      orderBy: "index+desc",
      ...requestOptions,
    };

    return this._http
      .get(
        `${UrlBuilder.buildChangesetUrl(
          ivaultId,
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
      .then((resp) => resp.changesets);
  }

  public async getUsers(
    ivaultId: string,
    requestOptions: RequestOptions = {}
  ): Promise<{ users: User[]; hasMore: boolean }> {
    return this._http
      .get(
        `${UrlBuilder.buildGetUsersUrl(
          ivaultId,
          this._serverEnvironmentPrefix
        )}${UrlBuilder.getQuery(requestOptions)}`,
        {
          headers: {
            [HttpHeaderNames.Prefer]: "return=representation",
            [HttpHeaderNames.Accept]:
              "application/vnd.szewec.szewtwin-platform.v2+json",
          },
        }
      )
      .then((resp) => ({
        users: resp.users,
        hasMore: !!resp._links?.next?.href,
      }));
  }

  public async getChangesetCheckpoint(
    ivaultId: string,
    changesetIndex: number,
    requestOptions: RequestOptions = {}
  ): Promise<Checkpoint> {
    const url = `${UrlBuilder.buildChangesetUrl(
      ivaultId,
      this._serverEnvironmentPrefix
    )}/${changesetIndex}/checkpoint${UrlBuilder.getQuery(requestOptions)}`;

    return this._http
      .get(url, {
        headers: {
          [HttpHeaderNames.Accept]:
            "application/vnd.szewec.szewtwin-platform.v2+json",
        },
      })
      .then((resp) => resp.checkpoint);
  }
}
