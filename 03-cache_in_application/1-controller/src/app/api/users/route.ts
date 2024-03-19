/* eslint-disable no-console,@typescript-eslint/no-unnecessary-condition,require-atomic-updates */
import { NextRequest, NextResponse } from "next/server";

import { UsersByCriteriaSearcher } from "../../../contexts/rrss/users/application/search_by_criteria/UsersByCriteriaSearcher";
import { UserPrimitives } from "../../../contexts/rrss/users/domain/User";
import { MySqlUserRepository } from "../../../contexts/rrss/users/infrastructure/MySqlUserRepository";
import { FiltersPrimitives } from "../../../contexts/shared/domain/criteria/Filter";
import { SearchParamsCriteriaFiltersParser } from "../../../contexts/shared/infrastructure/criteria/SearchParamsCriteriaFiltersParser";
import { MariaDBConnection } from "../../../contexts/shared/infrastructure/MariaDBConnection";

const searcher = new UsersByCriteriaSearcher(new MySqlUserRepository(new MariaDBConnection()));

type CachedData = {
	[key: string]: {
		users: UserPrimitives[];
		createdAt: number;
	};
};

const cacheTtlInSeconds = 5;

const cachedData: CachedData = {};

function generateCacheKey(
	filters: FiltersPrimitives[],
	orderBy: string | null,
	orderType: string | null,
	pageSize: number | null,
	pageNumber: number | null,
): string {
	return `${JSON.stringify(filters)}-${orderBy}-${orderType}-${pageSize}-${pageNumber}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
	console.log("Pidiendo /api/users");

	const { searchParams } = new URL(request.url);

	const filters = SearchParamsCriteriaFiltersParser.parse(searchParams);

	const cacheKey = generateCacheKey(
		filters,
		searchParams.get("orderBy"),
		searchParams.get("order"),
		searchParams.has("pageSize") ? parseInt(searchParams.get("pageSize") as string, 10) : null,
		searchParams.has("pageNumber") ? parseInt(searchParams.get("pageNumber") as string, 10) : null,
	);

	if (
		cachedData[cacheKey] &&
		Date.now() - cachedData[cacheKey].createdAt < cacheTtlInSeconds * 1000
	) {
		console.log("→ Devolviendo de caché");

		return NextResponse.json(cachedData[cacheKey].users);
	}

	const users = await searcher.search(
		filters,
		searchParams.get("orderBy"),
		searchParams.get("order"),
		searchParams.has("pageSize") ? parseInt(searchParams.get("pageSize") as string, 10) : null,
		searchParams.has("pageNumber") ? parseInt(searchParams.get("pageNumber") as string, 10) : null,
	);

	const primitiveUsers = users.map((user) => user.toPrimitives());

	cachedData[cacheKey] = {
		users: primitiveUsers,
		createdAt: Date.now(),
	};

	console.log("→ Devolviendo de base de datos");

	return NextResponse.json(primitiveUsers);
}
