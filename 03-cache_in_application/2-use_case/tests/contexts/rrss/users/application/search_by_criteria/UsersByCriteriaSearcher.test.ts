import { UsersByCriteriaSearcher } from "../../../../../../src/contexts/rrss/users/application/search_by_criteria/UsersByCriteriaSearcher";
import { CriteriaMother } from "../../../../shared/domain/criteria/CriteriaMother";
import { MockCache } from "../../../../shared/infrastructure/MockCache";
import { UserMother } from "../../domain/UserMother";
import { MockUserRepository } from "../../infrastructure/MockUserRepository";

describe("UsersByCriteriaSearcher should", () => {
	const repository = new MockUserRepository();
	const cache = new MockCache();
	const usersByCriteriaSearcher = new UsersByCriteriaSearcher(repository, cache);

	it("search users using a criteria when not in cache and store it", async () => {
		const criteria = CriteriaMother.create();
		const expectedUsers = [UserMother.create()];
		const userPrimitives = expectedUsers.map((user) => user.toPrimitives());

		cache.shouldNotExist(criteria.toString());
		repository.shouldMatch(criteria, expectedUsers);
		cache.shouldSet(criteria.toString(), userPrimitives, 100);

		expect(
			await usersByCriteriaSearcher.search(
				criteria.filters.toPrimitives(),
				criteria.order.orderBy.value,
				criteria.order.orderType.value,
				criteria.pageSize,
				criteria.pageNumber,
			),
		).toStrictEqual(expectedUsers);
	});

	it("search users using a criteria from cache", async () => {
		const criteria = CriteriaMother.create();
		const expectedUsers = [UserMother.create()];

		cache.shouldExist(criteria.toString());
		cache.shouldGet(criteria.toString(), expectedUsers);

		expect(
			await usersByCriteriaSearcher.search(
				criteria.filters.toPrimitives(),
				criteria.order.orderBy.value,
				criteria.order.orderType.value,
				criteria.pageSize,
				criteria.pageNumber,
			),
		).toStrictEqual(expectedUsers);
	});
});
