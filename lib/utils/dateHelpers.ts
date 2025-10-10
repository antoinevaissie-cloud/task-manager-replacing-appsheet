import dayjs from "dayjs";

export const today = () => dayjs().startOf("day");

export const tomorrow = () => today().add(1, "day");

export const nextMonday = () => {
  const base = today();
  const dayOfWeek = base.day();
  const diff = (8 - dayOfWeek) % 7 || 7;
  return base.add(diff, "day");
};

export const formatDisplayDate = (value?: string | null) =>
  value ? dayjs(value).format("MMM D, YYYY") : "No due date";

export const isPastDue = (value?: string | null) => (value ? dayjs(value).isBefore(today(), "day") : false);
