import type { DMMF } from './dmmf';
export declare namespace JsonRPC {
    type Request = {
        jsonrpc: '2.0';
        method: string;
        params?: any;
        id: number;
    };
    type Response = SuccessResponse | ErrorResponse;
    type SuccessResponse = {
        jsonrpc: '2.0';
        result: any;
        id: number;
    };
    type ErrorResponse = {
        jsonrpc: '2.0';
        error: {
            code: number;
            message: string;
            data: any;
        };
        id: number;
    };
}
export type Dictionary<T> = {
    [key: string]: T | undefined;
};
export interface GeneratorConfig {
    name: string;
    output: EnvValue | null;
    isCustomOutput?: boolean;
    provider: EnvValue;
    config: Dictionary<string | string[]>;
    binaryTargets: BinaryTargetsEnvValue[];
    previewFeatures: string[];
}
export interface EnvValue {
    fromEnvVar: null | string;
    value: null | string;
}
export interface BinaryTargetsEnvValue {
    fromEnvVar: string | null;
    value: string;
    native?: boolean;
}
export type ConnectorType = 'mysql' | 'mongodb' | 'sqlite' | 'postgresql' | 'postgres' | 'sqlserver' | 'cockroachdb' | 'jdbc:sqlserver';
export interface DataSource {
    name: string;
    provider: ConnectorType;
    activeProvider: ConnectorType;
    url: EnvValue;
    directUrl?: EnvValue;
    schemas: string[] | [];
}
export type BinaryPaths = {
    schemaEngine?: {
        [binaryTarget: string]: string;
    };
    queryEngine?: {
        [binaryTarget: string]: string;
    };
    libqueryEngine?: {
        [binaryTarget: string]: string;
    };
};
/** The options passed to the generator implementations */
export type GeneratorOptions = {
    generator: GeneratorConfig;
    otherGenerators: GeneratorConfig[];
    schemaPath: string;
    dmmf: DMMF.Document;
    datasources: DataSource[];
    datamodel: string;
    version: string;
    binaryPaths?: BinaryPaths;
    postinstall?: boolean;
    noEngine?: boolean;
};
export type EngineType = 'queryEngine' | 'libqueryEngine' | 'schemaEngine';
export type GeneratorManifest = {
    prettyName?: string;
    defaultOutput?: string;
    denylists?: {
        models?: string[];
        fields?: string[];
    };
    requiresGenerators?: string[];
    requiresEngines?: EngineType[];
    version?: string;
    requiresEngineVersion?: string;
};
