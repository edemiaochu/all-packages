/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Possible iVault Permission values. */
export enum IVaultPermission {
  /** Allows to view iVault in web browser, but does not allow to get its local copy and view in desktop app. */
  WebView = "ivaults_webview",
  /** Allows to open and view an iVault only in read-only state. */
  Read = "ivaults_read",
  /**
   * Allows to make changes to an iVault. Allows to create and modify Named Versions. Allows to create mapping
   * between PW connection and iVault to facilitate connectors.
   */
  Write = "ivaults_write",
  /**
   * Allows to create an iVault. Allows to configure access per iVault. Allows to manage Locks or local copies
   * for the entire iVault. This Permission is both iVault and szewTwin level Permission, but Create iVault operation
   * requires that user has `ivaults_manage` Permission on the szewTwin level. Use
   * {@link https://developer.szewec.com/apis/access-control/operations/get-szewtwin-permissions/ Access Control API}
   * to check if user can create an iVault on a given szewTwin.
   */
  Manage = "ivaults_manage",
  /**
   * Allows to delete an iVault. This Permission is only available on the szewTwin level. Use
   * {@link https://developer.szewec.com/apis/access-control/operations/get-szewtwin-permissions/ Access Control API}
   * to check if user can delete iVaults on a given szewTwin. */
  Delete = "ivaults-delete",
}

/** User Permissions. */
export interface UserPermissions {
  /** A set of iVault Permissions current user has on a given iVault. */
  permissions: IVaultPermission[];
}
