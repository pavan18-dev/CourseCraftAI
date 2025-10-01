import axios from "axios";
import { useState } from "react";
import Loader from "./Loader";
import ResultCard from "./ResultCard";

export default function FormCard() {
  const [field, setField] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/generate", {
        field,
        level,
      });
      setCourse(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        <input
          className="border p-2 w-full mb-2"
          type="text"
          placeholder="Enter field (e.g. Python, AI, Web Dev)"
          value={field}
          onChange={(e) => setField(e.target.value)}
        />
        <select
          className="border p-2 w-full mb-2"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
        <button className="btn-primary w-full" type="submit">
          Generate
        </button>
      </form>

      {loading && <Loader />}
      {course && <ResultCard course={course} />}
    </div>
  );
}
