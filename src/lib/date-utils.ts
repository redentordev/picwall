/**
 * Formats a date to a relative time string (e.g., "just now", "5m", "2h", "3d")
 */
export function formatTimeAgo(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - dateObj.getTime();

  // Convert to seconds
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return "just now";
  }

  // Convert to minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);

  // Less than an hour
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1m" : `${diffInMinutes}m`;
  }

  // Convert to hours
  const diffInHours = Math.floor(diffInMinutes / 60);

  // Less than a day
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1h" : `${diffInHours}h`;
  }

  // Convert to days
  const diffInDays = Math.floor(diffInHours / 24);

  // Less than a week
  if (diffInDays < 7) {
    return diffInDays === 1 ? "1d" : `${diffInDays}d`;
  }

  // Convert to weeks
  const diffInWeeks = Math.floor(diffInDays / 7);

  // Less than a month (roughly)
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? "1w" : `${diffInWeeks}w`;
  }

  // Convert to months
  const diffInMonths = Math.floor(diffInDays / 30);

  // Less than a year
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1mo" : `${diffInMonths}mo`;
  }

  // Convert to years
  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? "1y" : `${diffInYears}y`;
}

/**
 * Format a date to a more detailed string, useful for tooltips or detailed views
 */
export function formatDateTime(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}
