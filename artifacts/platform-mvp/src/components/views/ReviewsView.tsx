import { useEffect, useState } from "react";
import api from "../../lib/api";
import ViewHeader from "./ViewHeader";

interface Review {
  id: string;
  rating: number;
  review_text?: string;
  platform: string;
  status: string;
  created_at: string;
}

export default function ReviewsView() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/reviews")
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ViewHeader
        title="Reviews"
        subtitle="Customer reviews collected across platforms"
      />

      {loading ? (
        <p className="text-sm text-gray-400">Loading reviews...</p>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-100 p-10 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="text-sm text-red-600">Couldn't load reviews.</p>
          <p className="text-xs text-gray-400 mt-1">Please try again in a moment.</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <div className="text-3xl mb-2">⭐</div>
          <p className="text-sm text-gray-500">No reviews yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Ask the assistant to send a review request to your happy customers.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-gray-100 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-500">
                  {"★".repeat(r.rating)}
                  <span className="text-gray-200">
                    {"★".repeat(5 - r.rating)}
                  </span>
                </span>
                <span className="ml-auto text-xs text-gray-400 capitalize">
                  {r.platform} • {r.status}
                </span>
              </div>
              {r.review_text && (
                <p className="text-sm text-gray-600">{r.review_text}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
