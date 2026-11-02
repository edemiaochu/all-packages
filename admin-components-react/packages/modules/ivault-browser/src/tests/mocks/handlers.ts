/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { rest } from "msw";

export const handlers = [
  rest.get("https://api.szewec.com/ivaults/", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        iVaults:
          req.url.searchParams.get("$orderBy") === "name desc"
            ? [
                {
                  id: "fakeId",
                  displayName: "nameDescOrdered",
                },
              ]
            : [
                {
                  id: "fakeId",
                  displayName: "fakeName",
                },
              ],
      })
    );
  }),
  rest.get("https://api.szewec.com/szewtwins/", (req, res, ctx) => {
    if (req.url.searchParams.get("$search") === "searched") {
    }
    return res(
      ctx.status(200),
      ctx.json({
        szewTwins:
          req.url.searchParams.get("$search") === "searched"
            ? [
                {
                  id: "mySearched1",
                  displayName: "mySearchedName1",
                },
              ]
            : [
                {
                  id: "my1",
                  displayName: "myName1",
                },
              ],
      })
    );
  }),
  rest.get("https://api.szewec.com/szewtwins/favorites", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        szewTwins: [
          {
            id: "favorite1",
            displayName: "favoriteName1",
          },
        ],
      })
    );
  }),
  rest.get("https://api.szewec.com/szewtwins/recents", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        szewTwins: [
          {
            id: "recent1",
            displayName: "recentName1",
          },
        ],
      })
    );
  }),
];
