import { sha256 } from "js-sha256";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { UsersByCriteriaSearcher } from "../../../contexts/rrss/users/application/search_by_criteria/UsersByCriteriaSearcher";
import { MySqlUserRepository } from "../../../contexts/rrss/users/infrastructure/MySqlUserRepository";
import { SearchParamsCriteriaFiltersParser } from "../../../contexts/shared/infrastructure/criteria/SearchParamsCriteriaFiltersParser";
import { MariaDBConnection } from "../../../contexts/shared/infrastructure/MariaDBConnection";

const searcher = new UsersByCriteriaSearcher(new MySqlUserRepository(new MariaDBConnection()));

export async function GET(request: NextRequest): Promise<NextResponse> {
	// eslint-disable-next-line no-console
	console.log("Pidiendo /api/users");

	const { searchParams } = new URL(request.url);

	const filters = SearchParamsCriteriaFiltersParser.parse(searchParams);

	const users = await searcher.search(
		filters,
		searchParams.get("orderBy"),
		searchParams.get("order"),
		searchParams.has("pageSize") ? parseInt(searchParams.get("pageSize") as string, 10) : null,
		searchParams.has("pageNumber") ? parseInt(searchParams.get("pageNumber") as string, 10) : null,
	);

	const eTag = `"${sha256(users.map((user) => user.toPrimitives()).join(""))}"`;
	const headersList = headers();

	if (headersList.get("If-None-Match") === eTag) {
		return new NextResponse(null, { status: 304 });
	}

	const response = NextResponse.json(users.map((user) => user.toPrimitives()));
	response.headers.set("ETag", eTag);

	return response;
}
