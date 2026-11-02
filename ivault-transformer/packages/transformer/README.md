# @szewtwin/ivault-transformer

Copyright © Szewec Systems, Incorporated. All rights reserved. See LICENSE.md for license terms and full copyright notice.

## Description

The __@szewtwin/ivault-transformer__ package contains classes that handle traversing iVaults for exporting and importing their parts.

## Documentation

See the [szewTwin.js](https://www.szewtwinjs.org) documentation for more information.

## Versioning

This package, for the time being, relies on @internal APIs in szewTwin.js, and therefore has very strict peerDependencies versions.
We perform a version check at runtime to ensure this. Every new szewTwin.js version must be validated, and fixes are rarely ported
to old versions currently, you must request this in an issue. Removing Dependencies on internal APIs is ongoing.
You can find the latest @szewtwin/ivault-transformer version for your szewTwin.js version by copy and pasting this into a bash shell

(use git bash on windows).

```sh
MY_SZEWTWINJS_VERSION="3.6.0" # edit me
pnpm -s --package=semver -c dlx node <<EOF
json=""
require("https").get("http://localhost:4873//@szewtwin/ivault-transformer", r=>r.setEncoding("utf8").on("data", d=>json+=d).on("end", ()=>{
  semver=require(process.env.PATH.split(":").find(x=>x.includes(".bin"))+"/../semver")
  console.log(Object.entries(JSON.parse(json).versions)
              .filter(([,v])=>semver.satisfies("$MY_SZEWTWINJS_VERSION", v.peerDependencies["@szewtwin/core-backend"]))
              .map(([k,v])=>k).reverse())
}))
EOF
```

## Environment Variables

### TRANSFORMER_NO_STRICT_DEP_CHECK

Set this variable to `1` to disable strict dependency checks in `packages/transformer/src/transformer.ts`. The strict dependency check validates that the version of @szewtwinjs/core-backend provided falls in the range defined by the peerDependencies of the transformer package.

### SUGGEST_TRANSFORMER_VERSIONS

Set this variable to `1` to enable `packages/transformer/src/transformer.ts` to suggest compatible versions if dependencies are not in the specified peer dependency range of this package.

```dotenv
# Disable strict dependency checks in transformer.ts
TRANSFORMER_NO_STRICT_DEP_CHECK=1

# Enable version suggestions in transformer.ts
SUGGEST_TRANSFORMER_VERSIONS=1
