import { Cache } from "../../../shared/domain/Cache";
import { Criteria } from "../../../shared/domain/criteria/Criteria";
import { CriteriaToSqlConverter } from "../../../shared/infrastructure/criteria/CriteriaToSqlConverter";
import { MariaDBConnection } from "../../../shared/infrastructure/MariaDBConnection";
import { User, UserPrimitives } from "../domain/User";
import { UserId } from "../domain/UserId";
import { UserRepository } from "../domain/UserRepository";

type DatabaseUser = {
	id: string;
	name: string;
	email: string;
	profile_picture: string;
	status: string;
};

export class MySqlUserRepository implements UserRepository {
	constructor(
		private readonly connection: MariaDBConnection,
		private readonly cache: Cache,
	) {}

	async save(user: User): Promise<void> {
		const userPrimitives = user.toPrimitives();

		const query = `
			INSERT INTO rrss__users (id, name, email, profile_picture, status)
			VALUES (
				'${userPrimitives.id}',
				'${userPrimitives.name}',
				'${userPrimitives.email}',
				'${userPrimitives.profilePicture}',
				'${userPrimitives.status.valueOf()}'
			);`;

		await this.connection.execute(query);
	}

	async search(id: UserId): Promise<User | null> {
		const query = `SELECT id, name, email, profile_picture, status FROM rrss__users WHERE id = '${id.value}';`;

		const result = await this.connection.searchOne<DatabaseUser>(query);

		if (!result) {
			return null;
		}

		return User.fromPrimitives({
			id: result.id,
			name: result.name,
			email: result.email,
			profilePicture: result.profile_picture,
			status: result.status,
		});
	}

	async matching(criteria: Criteria): Promise<User[]> {
		if (await this.cache.has(criteria.toString())) {
			return await this.findInCache(criteria);
		}

		await new Promise((resolve) => {
			setTimeout(resolve, 3000);
		});

		const converter = new CriteriaToSqlConverter();

		console.log("→ Obteniendo de base de datos");
		const result = await this.connection.searchAll<DatabaseUser>(
			converter.convert(
				["id", "name", "email", "profile_picture", "status"],
				"rrss__users",
				criteria,
				{
					fullname: "name",
				},
			),
		);

		const users = result.map((user) =>
			User.fromPrimitives({
				id: user.id,
				name: user.name,
				email: user.email,
				profilePicture: user.profile_picture,
				status: user.status,
			}),
		);

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
