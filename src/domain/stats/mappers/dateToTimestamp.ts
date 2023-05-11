import { DateTime } from "luxon";
import { Timestamp } from "../Timestamp";

export function dateToTimestamp(date: Date): Timestamp {
  const d = DateTime.fromJSDate(date);
  return {
    year: d.toFormat("y"),
    month: d.toFormat("MM"),
    week: d.toFormat("W"),
    day: d.toFormat("dd"),
    hour: d.toFormat("HH"),
    minute: d.toFormat("mm"),
  };
}
