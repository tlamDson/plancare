import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import "@/styles/calendar.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 rdp-root", className)}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return (
              <ChevronLeft className="h-4 w-4 text-foreground" {...props} />
            );
          }
          return (
            <ChevronRight className="h-4 w-4 text-foreground" {...props} />
          );
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
