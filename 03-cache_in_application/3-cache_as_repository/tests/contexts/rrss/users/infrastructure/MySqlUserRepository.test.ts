import { MySqlUserRepository } from "../../../../../src/contexts/rrss/users/infrastructure/MySqlUserRepository";
import { MariaDBConnection } from "../../../../../src/contexts/shared/infrastructure/MariaDBConnection";
import { CriteriaMother } from "../../../shared/domain/criteria/CriteriaMother";
import { MockCache } from "../../../shared/infrastructure/MockCache";
import { UserIdMother } from "../domain/UserIdMother";
import { UserMother } from "../domain/UserMother";

describe("MySqlUserRepository should", () => {
	const connection = new MariaDBConnection();
	const cache = new MockCache();
	const repository = new MySqlUserRepository(connection, cache);

	beforeEach(async () => await connection.truncate("rrss__users"));
	afterAll(async () => await connection.close());

	it("save a user", async () => {
		const user = UserMother.create();

		await repository.save(user);
	});

	it("return null searching a non existing user", async () => {
		const userId = UserIdMother.create();

		expect(await repository.search(userId)).toBeNull();
	});

	it("return existing user", async () => {
		const user = UserMother.create();

		await repository.save(user);

		expect(await repository.search(user.id)).toStrictEqual(user);
	});

	it("return existing user searching by criteria when not in cache and store it", async () => {
		const javi = UserMother.create({ name: "Javi" });
		const rafa = UserMother.create({ name: "Rafa" });
		const codelyber = UserMother.create({ name: "Codelyber" });

		await repository.save(javi);
		await repository.save(rafa);
		await repository.save(codelyber);

		const criteria = CriteriaMother.withOneFilter("name", "EQUAL", "Javi");

		cache.shouldNotExist(criteria.toString());
		cache.shouldSet(criteria.toString(), [javi.toPrimitives()], 100);

		expect(await repository.matching(criteria)).toStrictEqual([javi]);
	});

	it("return existing user searching by criteria from cache", async () => {
		const javi = UserMother.create({ name: "Javi" });
		const rafa = UserMother.create({ name: "Rafa" });
		const codelyber = UserMother.create({ name: "Codelyber" });

		await repository.save(javi);
		await repository.save(rafa);
		await repository.save(codelyber);

		const criteria = CriteriaMother.withOneFilter("name", "EQUAL", "Javi");

		cache.shouldExist(criteria.toString());
		cache.shouldGet(criteria.toString(), [javi]);

		expect(await repository.matching(criteria)).toStrictEqual([javi]);
	});
});
