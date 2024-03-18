export interface Cache {
	has(key: string): Promise<boolean>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get<T>(key: string, deserializer: (parsedJson: any) => T): Promise<T | null>;

	set<T>(key: string, value: T, ttlInSeconds: number): Promise<void>;
}
