/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useCallback, useEffect, useRef, useState } from "react";
import { useIVaultChangeListener } from "../../UseIVaultChangeListener.js";

import type { GuidString } from "@szewtwin/core-szewec";
import type { IVaultConnection } from "@szewtwin/core-frontend";

/** @internal */
export interface CreateCacheProps<TCacheSpecificProps> {
  ivault: IVaultConnection;
  specificProps: TCacheSpecificProps;
  componentId: GuidString;
}

/** @internal */
export interface UseIdsCacheProps<TCache, TCacheSpecificProps> {
  ivault: IVaultConnection;
  createCache: (props: CreateCacheProps<TCacheSpecificProps>) => TCache;
  cacheSpecificProps: TCacheSpecificProps;
  componentId: GuidString;
}

/** @internal */
export function useIdsCache<TCache extends Disposable, TCacheSpecificProps extends object>(
  props: UseIdsCacheProps<TCache, TCacheSpecificProps>,
): { getCache: () => TCache } {
  const cacheRef = useRef<TCache | undefined>(undefined);
  const clearCacheRef = useRef(() => {
    cacheRef.current?.[Symbol.dispose]?.();
    cacheRef.current = undefined;
  });
  const { ivault, createCache, cacheSpecificProps } = props;

  const createCacheGetterRef = useRef((currIvault: IVaultConnection, specificProps: TCacheSpecificProps, componentId: GuidString) => {
    return () => {
      if (cacheRef.current === undefined) {
        cacheRef.current = createCache({ ivault: currIvault, specificProps, componentId });
      }
      return cacheRef.current;
    };
  });

  const [getCache, setCacheGetter] = useState<() => TCache>(() => createCacheGetterRef.current(ivault, cacheSpecificProps, props.componentId));

  useEffect(() => {
    // clear cache in case it was created before `useEffect` was run first time
    clearCacheRef.current();

    // make sure all cache users rerender
    setCacheGetter(() => createCacheGetterRef.current(ivault, cacheSpecificProps, props.componentId));
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      clearCacheRef.current();
    };
  }, [ivault, cacheSpecificProps, props.componentId]);

  useIVaultChangeListener({
    ivault,
    action: useCallback(() => {
      clearCacheRef.current();
      // make sure all cache users rerender
      setCacheGetter(() => createCacheGetterRef.current(ivault, cacheSpecificProps, props.componentId));
    }, [ivault, cacheSpecificProps, props.componentId]),
  });

  return {
    getCache,
  };
}
