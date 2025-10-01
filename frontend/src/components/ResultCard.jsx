export default function ResultCard({ course }) {
  return (
    <div className="card mt-4">
      <h2 className="text-xl font-bold mb-2">{course.title}</h2>
      <ul className="space-y-3">
        {course.modules.map((m) => (
          <li key={m.id} className="border p-3 rounded">
            <h3 className="font-semibold">
              Week {m.week}: {m.title}
            </h3>
            <p className="text-sm">{m.description}</p>
            <p className="text-xs text-gray-500">
              Duration: {m.durationHours} hrs
            </p>
            {m.resources.length > 0 && (
              <ul className="mt-2 list-disc ml-4">
                {m.resources.map((r, i) => (
                  <li key={i}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {r.title} ({r.type})
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
