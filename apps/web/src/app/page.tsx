export default async function HomePage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/grades/student_123`, {
    cache: "no-store",
  });
  const grades = await res.json();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Sổ liên lạc điện tử (Web)</h1>
      <ul className="mt-4 space-y-2">
        {grades.map((g: any, i: number) => (
          <li key={i} className="p-3 rounded-lg shadow bg-white">
            Môn {g.subject}: {g.score}
          </li>
        ))}
      </ul>
    </main>
  );
}
