import type { Expand, GlobalKeysState } from "@algorandfoundation/xgov/registry";

export type RegistryGlobalState = Omit<Partial<Expand<GlobalKeysState>>, 'committeeManager' | 'xgovDaemon' | 'kycProvider' | 'xgovManager' | 'xgovPayor' | 'xgovCouncil' | 'xgovSubscriber'> & {
    committeeManager: string;
    xgovDaemon: string;
    kycProvider: string;
    xgovManager: string;
    xgovPayor: string;
    xgovCouncil: string;
    xgovSubscriber: string;
};
