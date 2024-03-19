import {
	createClient,
	RedisClientType,
	RedisDefaultModules,
	RedisFunctions,
	RedisModules,
	RedisScripts,
} from "redis";

import { Cache } from "../domain/Cache";

export class RedisCache implements Cache {
	private readonly client: Promise<
		RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>
	>;

	constructor() {
		this.client = createClient().connect();
	}

	async has(key: string): Promise<boolean> {
		return (await (await this.client).exists(key)) === 1;
	}

	public async get<T>(key: string, deserializer: (parsedJson: unknown) => T): Promise<T | null> {
		const value = await (await this.client).get(key);

		if (value !== null) {
			try {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const parsedValue = JSON.parse(value);

				return deserializer(parsedValue);
			} catch (error) {
				console.error("Error parsing JSON from Redis", error);

				return null;
			}
		}

		return null;
	}

	public async set<T>(key: string, value: T, ttlInSeconds: number): Promise<void> {
		const serializedValue = JSON.stringify(value);

		await (await this.client).set(key, serializedValue, { EX: ttlInSeconds });
	}
}
