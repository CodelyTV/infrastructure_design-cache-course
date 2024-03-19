"use client";

import styles from "./page.module.css";

export default function Home() {
	const fetchUsers = async () => {
		const startTime = performance.now();
		await fetch("http://localhost:80/api/users");
		const endTime = performance.now();

		// eslint-disable-next-line no-console
		console.log(`La petición a /api/users ha tardado ${endTime - startTime} milisegundos`);
	};

	return (
		<main className={styles.main}>
			{/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
			<button onClick={fetchUsers}>Cargar Usuarios</button>
		</main>
	);
}
