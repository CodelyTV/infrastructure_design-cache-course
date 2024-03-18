/* eslint-disable no-console */
import { Cache } from "../../../../shared/domain/Cache";
import { Criteria } from "../../../../shared/domain/criteria/Criteria";
import { FiltersPrimitives } from "../../../../shared/domain/criteria/Filter";
import { User, UserPrimitives } from "../../domain/User";
import { UserRepository } from "../../domain/UserRepository";

export class UsersByCriteriaSearcher {
	constructor(
		private readonly repository: UserRepository,
		private readonly cache: Cache,
	) {}

	async search(
		filters: FiltersPrimitives[],
		orderBy: string | null,
		orderType: string | null,
		pageSize: number | null,
		pageNumber: number | null,
	): Promise<User[]> {
		const criteria = Criteria.fromPrimitives(filters, orderBy, orderType, pageSize, pageNumber);

		if (await this.cache.has(criteria.toString())) {
			return await this.findInCache(criteria);
		}

		console.log("→ Obteniendo de base de datos");
		const users = await this.repository.matching(criteria);

		await this.saveInCache(criteria, users);

		return users;
	}

	private async findInCache(criteria: Criteria): Promise<User[]> {
		console.log("→ Obteniendo de caché");

		return (await this.cache.get(criteria.toString(), (primitives: UserPrimitives[]) =>
			primitives.map((data) => User.fromPrimitives(data)),
		)) as User[];
	}

	private async saveInCache(criteria: Criteria, users: User[]): Promise<void> {
		await this.cache.set(
			criteria.toString(),
			users.map((user) => user.toPrimitives()),
			100,
		);
	}
}
