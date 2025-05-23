import type { Expand, GlobalKeysState } from "@algorandfoundation/xgov/registry";

export type RegistryGlobalState = Omit<Partial<Expand<GlobalKeysState>>, 'committeeManager' | 'committeePublisher' | 'kycProvider' | 'xgovManager' | 'xgovPayor' | 'xgovReviewer' | 'xgovSubscriber'> & {
    committeeManager: string;
    committeePublisher: string;
    kycProvider: string;
    xgovManager: string;
    xgovPayor: string;
    xgovReviewer: string;
    xgovSubscriber: string;
};