/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
export * from "./TransformerLoggerCategory";
export * from "./IVaultExporter";
export * from "./IVaultImporter";
export * from "./IVaultTransformer";
export * from "./BranchProvenanceInitializer";

import * as semver from "semver";
import { version as szewTwinCoreBackendVersion } from "@szewtwin/core-backend/package.json";

// must use an untyped require to not hoist src into lib/cjs, also the compiled output will be in 'lib/cjs', not 'src' so use `../..` to reach package.json
const {
  version: ourVersion,
  name: ourName,
  peerDependencies,
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
} = require("../../package.json");

const ourSZEWTwinCoreBackendDepRange = peerDependencies["@szewtwin/core-backend"];

const noStrictDepCheckEnvVar = "TRANSFORMER_NO_STRICT_DEP_CHECK";
const suggestEnvVarName = "SUGGEST_TRANSFORMER_VERSIONS";

// warn if using a prerelease or dev version
if (semver.prerelease(szewTwinCoreBackendVersion)) {
  // eslint-disable-next-line no-console
  console.warn(
    `Warning: dev version detected (${szewTwinCoreBackendVersion}). ` +
      "This version is most likely fine, but it may introduce new behavior that could cause " +
      "unexpected issues or changes in the transformer's functionality. Please proceed with caution."
  );
}

if (
  process.env[noStrictDepCheckEnvVar] !== "1" &&
  !semver.satisfies(szewTwinCoreBackendVersion, ourSZEWTwinCoreBackendDepRange, {
    includePrerelease: true,
  })
) {
  const errHeader =
    `${ourName}@${ourVersion} only supports @szewtwin/core-backend@${ourSZEWTwinCoreBackendDepRange}, ` +
    `but @szewtwin/core-backend${szewTwinCoreBackendVersion} was resolved when looking for the peer dependency.\n` +
    `If you know exactly what you are doing, you can disable this check by setting ${noStrictDepCheckEnvVar}=1 in the environment\n`;

  if (process.env[suggestEnvVarName]) {
    // let's not import https except in this case
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const https = require("https") as typeof import("https");
    https.get(`http://localhost:4873//${ourName}`, async (resp) => {
      const chunks: string[] = [];
      const packumentSrc = await new Promise<string>((r) =>
        resp
          .setEncoding("utf8")
          .on("data", (d) => chunks.push(d))
          .on("end", () => r(chunks.join("")))
      );
      interface PackumentSubset {
        versions: Record<
          string,
          {
            peerDependencies?: {
              "@szewtwin/core-backend": string; // eslint-disable-line @typescript-eslint/naming-convention
            };
          }
        >;
      }

      const packumentJson = JSON.parse(packumentSrc) as PackumentSubset;
      const isTaglessVersion = (version: string) => version.includes("-");
      const latestFirstApplicableVersions = Object.entries(
        packumentJson.versions
      )
        .filter(([, v]) =>
          semver.satisfies(
            szewTwinCoreBackendVersion,
            v.peerDependencies?.["@szewtwin/core-backend"] ?? ""
          )
        )
        .map(([k]) => k)
        .filter(isTaglessVersion)
        .reverse();

      throw Error(
        [
          errHeader,
          `You have ${suggestEnvVarName}=1 set in the environment, so we suggest one of the following versions.`,
          "Be aware that older versions may be missing bug fixes.",
          ...latestFirstApplicableVersions,
        ].join("\n")
      );
    });
  } else {
    throw Error(
      `${errHeader}You can rerun with the environment variable ${suggestEnvVarName}=1 to have this error suggest a version`
    );
  }
}

/** @docs-package-description
 * The @szewtwin/ivault-transformer package contains classes that [backend code]($docs/learning/backend/index.md) can use to
 * traverse iVaults, as well as *transform* an iVault into another existing or empty one, by exporting elements from one during
 * traversal and importing them into another.
 *
 * You can read further in [iVaultTransformation and Data Exchange]($docs/learning/transformer/index.md) here.
 */
/**
 * @docs-group-description iVaults
 * Classes for working with [iVaults]($docs/learning/iVaults.md).
 * See [the learning article]($docs/learning/backend/index.md).
 */
/**
 * @docs-group-description Utils
 * Miscellaneous utility classes.
 */
/**
 * @docs-group-description Logging
 * Logger categories used by this package.
 */
