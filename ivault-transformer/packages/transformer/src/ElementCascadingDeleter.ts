/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module iVaults
 */
import {
  ElementTreeDeleter,
  ElementTreeWalkerScope,
  IVaultDb,
} from "@szewtwin/core-backend";
import { Id64String } from "@szewtwin/core-szewec";
import { QueryBinder } from "@szewtwin/core-common";

/** Deletes an element tree and code scope references starting with the specified top element. The top element is also deleted. Uses ElementCascadeDeleter.
 * @param iVault The iVault
 * @param topElement The parent of the sub-tree
 */
export function deleteElementTreeCascade(
  iVault: IVaultDb,
  topElement: Id64String
): void {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const del = new ElementCascadingDeleter(iVault);
  del.deleteNormalElements(topElement);
  del.deleteSpecialElements();
}

/** Deletes an entire element tree, including sub-models, child elements and code scope references.
 * Items are deleted in bottom-up order. Definitions and Subjects are deleted after normal elements.
 * Call deleteNormalElements on each tree. Then call deleteSpecialElements.
 */
export class ElementCascadingDeleter extends ElementTreeDeleter {
  protected shouldVisitCodeScopes(
    _elementId: Id64String,
    _scope: ElementTreeWalkerScope
  ) {
    return true;
  }

  /** The main tree-walking function */
  protected override processElementTree(
    element: Id64String,
    scope: ElementTreeWalkerScope
  ): void {
    if (this.shouldVisitCodeScopes(element, scope)) {
      this._processCodeScopes(element, scope);
    }
    super.processElementTree(element, scope);
  }
  /** Process code scope references */
  private _processCodeScopes(
    element: Id64String,
    scope: ElementTreeWalkerScope
  ) {
    const newScope = new ElementTreeWalkerScope(scope, element);
    const query = `
      SELECT DMInstanceId
      FROM bis.Element
      WHERE CodeScope.id=:scopeId
        AND Parent.id IS NULL
    `;

    const params = new QueryBinder().bindId("scopeId", element);

    this.txn.iVault.withQueryReader(
      query,
      (reader) => {
        for (const row of reader) {
          const elementId = row[0] as Id64String;
          this.processElementTree(elementId, newScope);
        }
      },
      params
    );
  }
}
