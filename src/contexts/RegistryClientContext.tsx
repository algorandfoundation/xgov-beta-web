import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { XGovRegistryClient } from '@algorandfoundation/xgov/registry';
import type { BoxName } from '@algorandfoundation/algokit-utils/types/app';
import { Algorand } from 'src/algorand/algo-client';
import { encodeAddress } from "algosdk";

export interface ProposerBoxData extends Array<boolean | BigInt> {
  0: boolean;
  1: boolean;
  2: BigInt;
}

interface Roles {
  kycProvider: string;
  xGovManager: string;
  committeePublisher: string;
  committeeManager: string;
  xGovPayor: string;
  xGovReviewer: string;
  xGovSubscriber: string;
}

interface RegistryClientContextProps {
  registryClient: XGovRegistryClient | null;
  isInitialized: boolean;
  loading: boolean;
  boxesLoading: boolean;
  globalStateLoading: boolean;
  boxes: { name: BoxName, value: Uint8Array }[];
  globalState: any; // Adjust the type as needed
  roles: Roles;
  refreshBoxes: () => void;
  refreshGlobalState: () => void;
  refreshRoles: () => void;
}

const RegistryClientContext = createContext<RegistryClientContextProps>({
  registryClient: null,
  isInitialized: false,
  loading: true,
  boxesLoading: true,
  globalStateLoading: true,
  boxes: [],
  globalState: null,
  roles: {
    kycProvider: '',
    xGovManager: '',
    committeePublisher: '',
    committeeManager: '',
    xGovPayor: '',
    xGovReviewer: '',
    xGovSubscriber: '',
  },
  refreshBoxes: () => {},
  refreshGlobalState: () => {},
  refreshRoles: () => {},
});

export const useRegistryClient = () => useContext(RegistryClientContext);

export const RegistryClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registryClient, setRegistryClient] = useState<XGovRegistryClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boxesLoading, setBoxesLoading] = useState(true);
  const [globalStateLoading, setGlobalStateLoading] = useState(true);
  const [boxes, setBoxes] = useState<{ name: BoxName, value: Uint8Array }[]>([]);
  const [globalState, setGlobalState] = useState<any>(null);
  const [roles, setRoles] = useState<Roles>({
    kycProvider: '',
    xGovManager: '',
    committeePublisher: '',
    committeeManager: '',
    xGovPayor: '',
    xGovReviewer: '',
    xGovSubscriber: '',
  });

  const initializeRegistryClient = useCallback(async () => {
    try {
      const client = await XGovRegistryClient.fromCreatorAndName({
        creatorAddress: import.meta.env.PUBLIC_REGISTRY_CREATOR_ADDRESS,
        algorand: Algorand,
      });
      setRegistryClient(client);
      setIsInitialized(true);
    } catch (error) {
      console.error("No Registry Client found", error);
      setIsInitialized(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBoxes = useCallback(async () => {
    if (registryClient) {
      setBoxesLoading(true);
      try {
        const fetchedBoxes = await registryClient.appClient.getBoxValues();
        setBoxes(fetchedBoxes);
      } catch (error) {
        console.error("Failed to fetch xGovRegistry boxes", error);
        setBoxes([]);
      } finally {
        setBoxesLoading(false);
      }
    }
  }, [registryClient]);

  const fetchGlobalState = useCallback(async () => {
    if (registryClient) {
      setGlobalStateLoading(true);
      try {
        const state = await registryClient.state.global.getAll();
        setGlobalState(state);
      } catch (error) {
        console.error("Failed to fetch xGovRegistry global state", error);
      } finally {
        setGlobalStateLoading(false);
      }
    }
  }, [registryClient]);

  const fetchRoles = useCallback(() => {
    if (globalState) {
      setRoles({
        kycProvider: globalState.kycProvider ? encodeAddress(globalState.kycProvider.asByteArray()) : '',
        xGovManager: globalState.xgovManager ? encodeAddress(globalState.xgovManager.asByteArray()) : '',
        committeePublisher: globalState.committeePublisher ? encodeAddress(globalState.committeePublisher.asByteArray()) : '',
        committeeManager: globalState.committeeManager ? encodeAddress(globalState.committeeManager.asByteArray()) : '',
        xGovPayor: globalState.xgovPayor ? encodeAddress(globalState.xgovPayor.asByteArray()) : '',
        xGovReviewer: globalState.xgovReviewer ? encodeAddress(globalState.xgovReviewer.asByteArray()) : '',
        xGovSubscriber: globalState.xgovSubscriber ? encodeAddress(globalState.xgovSubscriber.asByteArray()) : '',
      });
    }
  }, [globalState]);

  const refreshBoxes = useCallback(async () => {
    await fetchBoxes();
    await fetchGlobalState();
    fetchRoles();
  }, [fetchBoxes, fetchGlobalState, fetchRoles]);

  const refreshGlobalState = useCallback(async () => {
    await fetchGlobalState();
    fetchRoles();
  }, [fetchGlobalState, fetchRoles]);

  const refreshRoles = useCallback(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    initializeRegistryClient();
  }, [initializeRegistryClient]);

  useEffect(() => {
    if (registryClient) {
      fetchBoxes();
      fetchGlobalState();
    }
  }, [registryClient, fetchBoxes, fetchGlobalState]);

  useEffect(() => {
    if (!globalStateLoading && globalState) {
      fetchRoles();
    }
  }, [globalStateLoading, globalState, fetchRoles]);

  return (
    <RegistryClientContext.Provider value={{ registryClient, isInitialized, loading, boxesLoading, globalStateLoading, boxes, globalState, roles, refreshBoxes, refreshGlobalState, refreshRoles }}>
      {children}
    </RegistryClientContext.Provider>
  );
};