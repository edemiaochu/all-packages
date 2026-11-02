/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IVaultDb } from "@szewtwin/core-backend";
import { SchemaLoader } from "@szewtwin/dmschema-metadata";
import { SchemaXml } from "@szewtwin/dmschema-locaters";

export class SchemaTestUtils {
  public static async schemaToXmlString(
    schemaName: string,
    iVault: IVaultDb
  ): Promise<string> {
    try {
      // Load the schema properties
      const schemaLoader = new SchemaLoader((name: string) =>
        iVault.getSchemaProps(name)
      );
      const schema = schemaLoader.getSchema(schemaName);

      if (!schema) {
        throw new Error(`Schema with name ${schemaName} not found.`);
      }

      // Writes a schema to an xml string
      const schemaXmlString = await SchemaXml.writeString(schema);
      return schemaXmlString;
    } catch (error) {
      throw error;
    }
  }
}
