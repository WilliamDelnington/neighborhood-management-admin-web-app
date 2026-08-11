import { API } from "@constants/common";
import { request } from "./request";

export type DigitalReadiness = {
    generatedAt: string;
    gis: {
        mode: string;
        externalMapProviderConfigured: boolean;
        totalHouses: number;
        housesWithCoordinates: number;
        housesWithoutCoordinates: number;
        coveragePercent: number;
        zeroCoordinatesTreatedAsMissing: boolean;
    };
    identity: {
        currentLoginMethod: string;
        nationalIdentityRequiredWhenProviderAvailable: boolean;
        users: { total: number; verified: number; unverified: number };
        citizens: { total: number; verified: number; unverified: number };
    };
    apiFirst: {
        versionedBasePath: string;
        adapterContract: boolean;
        twoWaySyncReady: boolean;
    };
    providers: Array<{
        code: string;
        name: string;
        capabilities: string[];
        status: "not_configured" | "configured_not_verified";
        configured: boolean;
        configuredFieldCount: number;
        requiredFieldCount: number;
    }>;
    compliance: {
        sensitiveFormEncryptionAtRest: boolean;
        personalDataEncryptionCoverage: "none" | "partial" | "full";
        auditLogging: boolean;
        levelTwoOrThreeCertified: boolean;
        decree13Certified: boolean;
        note: string;
    };
};

export const fetchDigitalReadiness = (): Promise<DigitalReadiness> =>
    request<DigitalReadiness>("GET", API.INTEGRATION_READINESS);
